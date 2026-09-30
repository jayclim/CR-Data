"""Offline checks for exact counts, battle identity, and history safety."""
import asyncio
import json
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from contextlib import ExitStack
from unittest.mock import patch

import fetch_meta as pipeline


class FixedDateTime(datetime):
    @classmethod
    def now(cls, tz=None):
        return datetime(2026, 9, 30, 10, tzinfo=timezone.utc).astimezone(tz or timezone.utc)


# This script runs in its own process; every pipeline refresh below uses the same UTC day.
patch.object(pipeline, "datetime", FixedDateTime).start()


base_names = ["Hog Rider", "Knight", "Archers", "Cannon", "Fireball", "The Log", "Skeletons"]
names = base_names + [f"Card {number}" for number in range(51)]
catalog = {name: {"id": number, "name": name, "elixir": 3, "icon": "https://example.com/card.png"}
           for number, name in enumerate(names, start=1)}


def deck(number):
    return [{"id": catalog[name]["id"], "name": name, "elixirCost": 3}
            for name in base_names + [f"Card {number}"]]


def battle(team, opponent, cards, won, seconds):
    played_at = datetime(2026, 9, 1, tzinfo=timezone.utc) + timedelta(seconds=seconds)
    return {"type": "pathOfLegend", "battleTime": played_at.strftime("%Y%m%dT%H%M%S.000Z"),
            "team": [{"tag": team, "cards": cards, "crowns": int(won)}],
            "opponent": [{"tag": opponent, "cards": cards, "crowns": int(not won)}]}


first = battle("#A", "#B", deck(0), True, 0)
mirrored = battle("#B", "#A", deck(0), False, 0)
other = battle("#C", "#D", deck(0), False, 100)


async def request(endpoint, session, params=None):
    if endpoint == "locations/global/pathoflegend/players":
        return {"items": [{"tag": tag, "clan": {"tag": "#CLAN"}} for tag in ("#A", "#B", "#C")]}
    if endpoint.startswith("clans/"):
        return {"location": {"isCountry": True, "countryCode": "US"}}
    if endpoint.endswith("battlelog"):
        if endpoint == "players/%23A/battlelog":
            return [first, first, *[battle("#A", "#B", deck(n), True, n) for n in range(1, 51)],
                    {**first, "battleTime": None}]
        if endpoint == "players/%23B/battlelog":
            return [mirrored, mirrored]
        return [other]
    return {}


async def empty(*args, **kwargs):
    return None


assert pipeline.determine_archetype([{"name": "Minion Giant", "elixirCost": 6}] + deck(0)[1:]) == ("Minion Giant", "Beatdown")
assert pipeline.battle_identity({**first, "battleTime": None}, "#A") is None
assert pipeline.battle_identity(first, "#A")[0] == pipeline.battle_identity(mirrored, "#B")[0]
assert pipeline.battle_identity({**first, "gameMode": {"id": 1}}, "#A")[0] != pipeline.battle_identity({**first, "gameMode": {"id": 2}}, "#A")[0]

with tempfile.TemporaryDirectory() as directory:
    output = Path(directory, "meta_snapshot.json")
    history_file = Path(directory, "meta_history.json")
    with ExitStack() as stack:
        stack.enter_context(patch.object(pipeline, "DATA_DIR", directory))
        stack.enter_context(patch.object(pipeline, "make_request", request))
        stack.enter_context(patch.object(pipeline, "fetch_cards_sync_wrapper", return_value=catalog))
        asyncio.run(pipeline.main())
        data = json.loads(output.read_text())
        history = json.loads(history_file.read_text())
        assert data["schema_version"] == 2
        assert (data["total_players"], data["total_decks"], data["unique_battles"]) == (3, 53, 52)
        assert len(data["cards"]) == 58 and len(data["top_cards"]) == 50
        assert data["top_cards"] == data["cards"][:50]
        assert all(card["id"] and "wins" in card for card in data["cards"])
        assert data["cards"][0]["count"] == 53 and data["cards"][0]["wins"] == 51
        assert data["top_decks"][0]["count"] == 3 and data["top_decks"][0]["wins"] == 1
        assert data["player_locations"] == [{"id": "US", "value": 3}]
        assert data["archetype_matchups_specific"] and data["archetype_matchups_generic"]
        assert all(row["total"] == 104 and row["wins"] == 52 and row["battle_count"] == 52 and row["win_rate"] == 50
                   for key in ("archetype_matchups_specific", "archetype_matchups_generic")
                   for row in data[key])
        assert history["schema_version"] == 2 and len(history["snapshots"]) == 1
        assert history["snapshots"][0]["cards"][0] == {
            key: data["cards"][0][key] for key in ("id", "name", "count", "wins", "usage_rate", "win_rate")}

        original = (output.read_bytes(), history_file.read_bytes())
        with patch.object(pipeline, "make_request", empty):
            try:
                asyncio.run(pipeline.main())
            except SystemExit as error:
                assert error.code == 1
            else:
                raise AssertionError("Empty fetch must fail")
        assert (output.read_bytes(), history_file.read_bytes()) == original

    with tempfile.TemporaryDirectory() as small_directory, ExitStack() as stack:
        stack.enter_context(patch.object(pipeline, "DATA_DIR", small_directory))
        stack.enter_context(patch.object(pipeline, "make_request", request))
        stack.enter_context(patch.object(pipeline, "fetch_cards_sync_wrapper", return_value=catalog))
        stack.enter_context(patch.object(pipeline, "BATTLE_LIMIT", 28))
        asyncio.run(pipeline.main())
        small = json.loads(Path(small_directory, "meta_snapshot.json").read_text())
        assert small["unique_battles"] < 30
        assert small["archetype_matchups_specific"] == []
        assert small["archetype_matchups_generic"] == []
        small_files = (Path(small_directory, "meta_snapshot.json"), Path(small_directory, "meta_history.json"))
        before_catalog_failure = tuple(path.read_bytes() for path in small_files)
        with patch.object(pipeline, "fetch_cards_sync_wrapper", return_value={}):
            try:
                asyncio.run(pipeline.main())
            except RuntimeError:
                pass
            else:
                raise AssertionError("Missing catalog must fail")
        assert tuple(path.read_bytes() for path in small_files) == before_catalog_failure

    new = dict(data, timestamp="2026-09-30T11:00:00+00:00")
    replaced = pipeline.updated_history(history_file, new)
    assert len(replaced["snapshots"]) == 1 and replaced["snapshots"][0]["timestamp"] == new["timestamp"]
    pipeline.atomic_json(history_file, replaced)
    next_day = dict(data, timestamp="2026-10-01T11:00:00+00:00")
    appended = pipeline.updated_history(history_file, next_day)
    assert [entry["date"] for entry in appended["snapshots"]] == ["2026-09-30", "2026-10-01"]
    pipeline.atomic_json(history_file, appended)
    old_files = (output.read_bytes(), history_file.read_bytes())
    with ExitStack() as stack:
        stack.enter_context(patch.object(pipeline, "DATA_DIR", directory))
        stack.enter_context(patch.object(pipeline, "make_request", request))
        stack.enter_context(patch.object(pipeline, "fetch_cards_sync_wrapper", return_value=catalog))
        try:
            asyncio.run(pipeline.main())
        except ValueError:
            pass
        else:
            raise AssertionError("Backdated refresh must fail")
    assert (output.read_bytes(), history_file.read_bytes()) == old_files
    much_later = dict(data, timestamp="2026-12-30T11:00:00+00:00")
    retained = pipeline.updated_history(history_file, much_later)
    assert [entry["date"] for entry in retained["snapshots"]] == ["2026-12-30"]
    try:
        pipeline.updated_history(history_file, data)
    except ValueError:
        pass
    else:
        raise AssertionError("Out-of-order history update must fail")
    history_file.write_text('{"schema_version": 1, "snapshots": []}')
    old_schema = history_file.read_bytes()
    try:
        pipeline.updated_history(history_file, data)
    except ValueError:
        pass
    else:
        raise AssertionError("Old history schema must fail")
    assert history_file.read_bytes() == old_schema

print("Snapshot regression passed")
