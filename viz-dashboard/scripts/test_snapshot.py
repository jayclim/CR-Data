"""Offline regression: real outcomes, single counts, and safe failed refreshes."""
import asyncio
import json
import tempfile
from pathlib import Path
from unittest.mock import patch
import fetch_meta as pipeline

cards = [{"name": name, "elixirCost": 3} for name in
         ["Hog Rider", "Knight", "Archers", "Cannon", "Fireball", "The Log", "Skeletons", "Ice Spirit"]]
catalog = {c["name"]: {"name": c["name"], "elixir": 3, "icon": "https://example.com/card.png"} for c in cards}

async def request(endpoint, session, params=None):
    if endpoint == "locations/global/pathoflegend/players":
        return {"items": [{"tag": "#A", "clan": {"tag": "#C"}}, {"tag": "#B", "clan": {"tag": "#C"}}]}
    if endpoint.startswith("clans/"):
        return {"location": {"isCountry": True, "countryCode": "US"}}
    if endpoint.endswith("battlelog"):
        win = endpoint.startswith("players/%23A")
        battle = {"type": "pathOfLegend", "team": [{"cards": cards, "crowns": int(win)}],
                  "opponent": [{"cards": cards, "crowns": int(not win)}]}
        draw = {"type": "PvP", "team": [{"cards": cards, "crowns": 0}], "opponent": [{"cards": cards, "crowns": 0}]}
        return [battle, draw, {"type": "pathOfLegend", "team": []}]
    return {}

async def empty(*args, **kwargs):
    return None

assert pipeline.determine_archetype([{"name": "Minion Giant", "elixirCost": 6}] + cards[1:]) == ("Minion Giant", "Beatdown")

with tempfile.TemporaryDirectory() as directory:
    with patch.object(pipeline, "DATA_DIR", directory), patch.object(pipeline, "make_request", request), patch.object(pipeline, "fetch_cards_sync_wrapper", return_value=catalog):
        asyncio.run(pipeline.main())
        output = Path(directory, "meta_snapshot.json")
        data = json.loads(output.read_text())
        assert data["total_decks"] == 2
        assert data["player_locations"] == [{"id": "US", "value": 2}]
        assert all(c["win_rate"] == 50 for c in data["top_cards"])
        assert data["top_decks"][0]["win_rate"] == 50
        assert all(s["count"] == 2 and s["synergy_rate"] == 100 for s in data["top_synergies"])
        original = output.read_bytes()
        with patch.object(pipeline, "make_request", empty):
            try:
                asyncio.run(pipeline.main())
            except SystemExit as error:
                assert error.code == 1
            else:
                raise AssertionError("Empty fetch must fail")
        assert output.read_bytes() == original
print("Snapshot regression passed")
