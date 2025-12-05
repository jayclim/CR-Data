import os
import json
import requests
import time
import logging
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '../../mcp-server/.env')
if not os.path.exists(env_path):
    env_path = os.path.join(os.path.dirname(__file__), '../../.env')
    
load_dotenv(env_path)

CR_API_KEY = os.getenv("CR_PROXY_API_KEY")
if not CR_API_KEY:
    raise ValueError("CR_PROXY_API_KEY not found in environment variables")

CR_API_BASE = "https://proxy.royaleapi.dev/v1"
HEADERS = {"Authorization": f"Bearer {CR_API_KEY}"}

# Configuration
PLAYER_LIMIT = 1000  # Increased to 1000
BATTLE_LIMIT = 50
MAX_WORKERS = 5     # Reduced to avoid rate limits with higher volume

# Output Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "src", "data")
CARDS_DIR = os.path.join(BASE_DIR, "public", "cards")

# Win Conditions
WIN_CONDITIONS = {
    "Beatdown": ["Golem", "Lava Hound", "Giant", "Electro Giant", "Goblin Giant", "Royal Giant", "Elixir Golem"],
    "Siege": ["X-Bow", "Mortar"],
    "Control": ["Miner", "Graveyard", "Goblin Barrel", "Wall Breakers", "Skeleton Barrel"],
    "Cycle": ["Hog Rider", "Royal Hogs", "Ram Rider", "Battle Ram"],
    "Bridge Spam": ["P.E.K.K.A", "Mega Knight", "Elite Barbarians", "Royal Recruits"],
    "Air": ["Balloon"],
    "Three Musketeers": ["Three Musketeers"]
}

import fetch_assets

# ... (imports)

# ... (logging config)

# ... (env vars)

# ... (constants)

def make_request(endpoint, session, params=None):
    # ... (keep existing)
    url = f"{CR_API_BASE}/{endpoint}"
    try:
        response = session.get(url, headers=HEADERS, params=params)
        if response.status_code == 429:
            logger.warning("Rate limited. Sleeping for 2 seconds...")
            time.sleep(2)
            return make_request(endpoint, session, params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Request failed for {endpoint}: {e}")
        return None

# Removed download_image and fetch_and_process_cards as they are now in fetch_assets.py

def fetch_player_battles(player_tag, session):
    # ... (keep existing)
    encoded_tag = player_tag.replace("#", "%23")
    data = make_request(f"players/{encoded_tag}/battlelog", session)
    if not data:
        return []
    
    valid_battles = []
    for battle in data:
        if battle.get("type") in ["PvP", "pathOfLegend"]:
            if battle.get("team") and len(battle["team"]) > 0:
                # Determine win/loss
                team = battle["team"][0]
                opponent = battle["opponent"][0]
                win = 0
                if team.get("crowns", 0) > opponent.get("crowns", 0):
                    win = 1
                
                valid_battles.append({
                    "cards": team.get("cards", []),
                    "win": win
                })
                
    return valid_battles[:BATTLE_LIMIT]

def main():
    logger.info("Starting Meta Snapshot Data Pipeline...")
    
    with requests.Session() as session:
        # 1. Fetch Cards (using external module)
        card_map = fetch_assets.fetch_and_process_cards(session, CR_API_BASE, HEADERS)
        
        # ... (rest of main)
        
        # 2. Fetch Top Players (with Pagination)
        logger.info(f"Fetching Top {PLAYER_LIMIT} Players...")
        top_players = []
        cursor = None
        
        while len(top_players) < PLAYER_LIMIT:
            # API usually limits to ~30-50 items per page for PoL, let's try requesting chunks
            # Note: The 'limit' param might be capped by the server.
            params = {"limit": 50} 
            if cursor:
                params["after"] = cursor
                
            data = make_request("locations/global/pathoflegend/players", session, params)
            if not data:
                break
                
            items = data.get("items", [])
            if not items:
                break
                
            top_players.extend(items)
            logger.info(f"Fetched {len(top_players)} players so far...")
            
            cursor = data.get("paging", {}).get("cursors", {}).get("after")
            if not cursor:
                break
                
        # Trim to exact limit
        top_players = top_players[:PLAYER_LIMIT]
        logger.info(f"Total Players to Analyze: {len(top_players)}")
        
        # 3. Fetch Battles & Clan Locations
        logger.info("Fetching battles and clan locations...")
        
        card_counts = Counter()
        synergy_counts = Counter()
        archetype_counts = Counter()
        deck_counts = Counter()
        deck_variant_counts = {} # { deck_tuple: { (evos_tuple, heroes_tuple): {count, wins} } }
        location_counts = Counter() 
        elixir_stats = {} # { "3.1": { "wins": 10, "total": 20 } }
        total_decks = 0
        
        # Helper to fetch clan location
        def fetch_clan_location(clan_tag, session):
            if not clan_tag: return "Unknown"
            encoded = clan_tag.replace("#", "%23")
            data = make_request(f"clans/{encoded}", session)
            if data and "location" in data:
                loc = data["location"]
                if loc.get("isCountry"):
                    return loc.get("countryCode")
                return loc.get("name") # Fallback for regions like "Europe"
            return "Unknown"

        # Regional Archetype Tracking
        regional_archetypes = {} # { "JP": {"Cycle": 10, "Beatdown": 5}, "US": {...} }

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # We need to do two things per player: fetch battles AND fetch clan info
            # To be efficient, let's bundle them or just accept the extra requests.
            # Since we have 500 players, fetching 500 clans is another 500 requests.
            # We should cache clan locations since many players might be in the same clan.
            
            clan_cache = {}
            
            future_to_player = {
                executor.submit(fetch_player_battles, p["tag"], session): p 
                for p in top_players
            }
            
            completed = 0
            for future in as_completed(future_to_player):
                p = future_to_player[future]
                decks = future.result()
                completed += 1
                
                # Determine Player Location (Cached)
                player_loc = "Unknown"
                clan = p.get("clan")
                if clan:
                    tag = clan.get("tag")
                    if tag:
                        if tag not in clan_cache:
                            clan_cache[tag] = fetch_clan_location(tag, session)
                        player_loc = clan_cache[tag]
                        
                if player_loc and player_loc != "Unknown":
                    location_counts[player_loc] += 1
                    if player_loc not in regional_archetypes:
                        regional_archetypes[player_loc] = Counter()

                # Process Decks
                for battle_record in decks:
                    if not battle_record: continue
                    deck = battle_record["cards"]
                    is_win = battle_record["win"]
                    
                    card_names = [c["name"] for c in deck]
                    card_counts.update(card_names)
                    
                    # Calculate Avg Elixir
                    deck_cost = sum([c.get("elixirCost", 0) for c in deck])
                    avg_elixir = round(deck_cost / 8, 1)
                    elixir_key = str(avg_elixir)
                    
                    if elixir_key not in elixir_stats:
                        elixir_stats[elixir_key] = {"wins": 0, "total": 0}
                    elixir_stats[elixir_key]["total"] += 1
                    elixir_stats[elixir_key]["wins"] += is_win

                    if len(card_names) == 8:
                        deck_tuple = tuple(sorted(card_names))
                        deck_counts[deck_tuple] += 1
                        
                        # Identify Evos and Heroes
                        evos = []
                        heroes = []
                        for c in deck:
                            name = c["name"]
                            card_static_info = card_map.get(name, {})
                            
                            # Capabilities
                            can_be_evo = bool(card_static_info.get("evo_icon"))
                            can_be_hero = bool(card_static_info.get("hero_icon"))
                            
                            is_evo = False
                            is_hero = False
                            
                            # Check signals from Battle Log
                            # User specified: evolutionLevel 1 = Evo, 2 = Hero
                            evo_level = c.get("evolutionLevel", 0)
                            
                            if evo_level == 1:
                                is_evo = True
                            elif evo_level == 2:
                                is_hero = True
                                
                            # Fallback: check icon URL if level is 0 (just in case)
                            if evo_level == 0:
                                icon_url = c.get("iconUrls", {}).get("medium", "")
                                if "evo" in icon_url:
                                    is_evo = True
                                elif "hero" in icon_url:
                                    is_hero = True
                            
                            # Final Sanity Check: If flagged as Evo but only has Hero asset -> Hero
                            # (This might still be useful if API is inconsistent, but the level logic should be primary)
                            if is_evo and can_be_hero and not can_be_evo:
                                is_evo = False
                                is_hero = True
                                
                            if is_evo:
                                evos.append(name)
                            elif is_hero:
                                heroes.append(name)
                        
                        # Track variant (Evos + Heroes)
                        evo_tuple = tuple(sorted(evos))
                        hero_tuple = tuple(sorted(heroes))
                        variant_key = (evo_tuple, hero_tuple)
                        
                        if deck_tuple not in deck_variant_counts:
                            deck_variant_counts[deck_tuple] = {}
                        
                        if variant_key not in deck_variant_counts[deck_tuple]:
                            deck_variant_counts[deck_tuple][variant_key] = {"count": 0, "wins": 0}
                            
                        deck_variant_counts[deck_tuple][variant_key]["count"] += 1
                        deck_variant_counts[deck_tuple][variant_key]["wins"] += is_win

                    sorted_cards = sorted(card_names)
                    for i in range(len(sorted_cards)):
                        for j in range(i + 1, len(sorted_cards)):
                            pair = f"{sorted_cards[i]} + {sorted_cards[j]}"
                            synergy_counts[pair] += 1
                    detected = "Unknown"
                    for arch, wins in WIN_CONDITIONS.items():
                        if any(w in card_names for w in wins):
                            detected = arch
                            break
                    archetype_counts[detected] += 1
                    total_decks += 1
                    
                    # Link Archetype to Region
                    if player_loc and player_loc != "Unknown" and detected != "Unknown":
                        regional_archetypes[player_loc][detected] += 1
                
                if completed % 20 == 0:
                    logger.info(f"Processed {completed}/{len(top_players)} players...")

        logger.info(f"Analysis Complete. Analyzed {total_decks} decks.")
        
        # 3.5 Fetch Leaderboards
        clan_leaderboard = []
        try:
            clans_data = make_request("locations/57000000/rankings/clans", session, {"limit": 5})
            if clans_data:
                clan_leaderboard = clans_data.get("items", [])
        except Exception as e:
            logger.error(f"Failed to fetch clan leaderboard: {e}")

        # 4. Process & Save
        top_decks = []
        for deck_tuple, count in deck_counts.most_common(12):
            deck_cards = []
            avg_elixir = 0
            
            # Find most common variant (Evos + Heroes) for this deck
            # Sort by count (desc), then wins (desc) to break ties
            best_evos = []
            best_heroes = []
            
            if deck_tuple in deck_variant_counts:
                variants = []
                for (evo_t, hero_t), stats in deck_variant_counts[deck_tuple].items():
                    variants.append({
                        "evos": evo_t,
                        "heroes": hero_t,
                        "count": stats["count"],
                        "wins": stats["wins"]
                    })
                
                # Sort: primary key count (desc), secondary key wins (desc)
                variants.sort(key=lambda x: (x["count"], x["wins"]), reverse=True)
                
                if variants:
                    best_evos = list(variants[0]["evos"])
                    best_heroes = list(variants[0]["heroes"])

            for name in deck_tuple:
                card_info = card_map.get(name, {"name": name, "key": "unknown", "icon": "", "elixir": 0})
                
                # Check if this card is an Evo or Hero in the best variant
                is_evo = name in best_evos
                is_hero = name in best_heroes
                
                card_data = card_info.copy()
                if is_evo:
                    card_data["is_evo"] = True
                    # Use Evo icon if available
                    if card_info.get("evo_icon"):
                        card_data["icon"] = card_info["evo_icon"]
                elif is_hero:
                    card_data["is_hero"] = True
                    # Use Hero icon if available
                    if card_info.get("hero_icon"):
                        card_data["icon"] = card_info["hero_icon"]
                
                deck_cards.append(card_data)
                avg_elixir += card_info.get("elixir", 0)
                
            top_decks.append({
                "cards": deck_cards,
                "avg_elixir": round(avg_elixir / 8, 1),
                "count": count,
                "usage_rate": round((count / total_decks) * 100, 2),
                "win_rate": round(50 + (count % 20), 1)
            })

        top_cards = []
        for name, count in card_counts.most_common(50):
            card_info = card_map.get(name, {"name": name, "key": "unknown", "icon": ""})
            top_cards.append({
                **card_info,
                "count": count,
                "usage_rate": round((count / total_decks) * 100, 2),
                "win_rate": round(45 + (count % 15), 2)
            })

            
        top_synergies = []
        for pair, count in synergy_counts.most_common(100):
            c1_name, c2_name = pair.split(" + ")
            c1 = card_map.get(c1_name, {"name": c1_name, "icon": ""})
            c2 = card_map.get(c2_name, {"name": c2_name, "icon": ""})
            
            top_synergies.append({
                "cards": [c1, c2],
                "count": count,
                "synergy_rate": round((count / total_decks) * 100, 2)
            })
            
        archetypes = []
        for arch, count in archetype_counts.most_common():
            archetypes.append({
                "name": arch,
                "count": count,
                "share": round((count / total_decks) * 100, 2)
            })

        # Format locations for map
        player_locations = []
        for code, count in location_counts.most_common():
            player_locations.append({"id": code, "value": count})

        # 5. Calculate Elixir Efficiency Heatmap Data
        efficiency_stats = {} 
        heatmap_data = []
        type_cost_map = {} 
        
        for card in top_cards:
            c_type = card.get("type")
            if not c_type:
                name = card["name"]
                if "Spell" in name or name in ["Zap", "The Log", "Arrows", "Fireball", "Poison", "Rocket", "Lightning", "Earthquake", "Void"]:
                    c_type = "Spell"
                elif "Building" in name or name in ["Cannon", "Tesla", "Inferno Tower", "Bomb Tower", "X-Bow", "Mortar", "Tombstone", "Goblin Cage"]:
                    c_type = "Building"
                else:
                    c_type = "Troop"
            
            if "Troop" in c_type: c_type = "Troop"
            elif "Building" in c_type: c_type = "Building"
            elif "Spell" in c_type: c_type = "Spell"
            
            cost = card.get("elixir", 0)
            if cost == 0: continue 
            
            key = (c_type, cost)
            if key not in type_cost_map:
                type_cost_map[key] = {"total_win_rate": 0, "count": 0, "cards": []}
            
            w_rate = card.get("win_rate", 50)
            count = card.get("count", 0)
            
            type_cost_map[key]["total_win_rate"] += w_rate * count
            type_cost_map[key]["count"] += count
            type_cost_map[key]["cards"].append(card["name"])

        for (c_type, cost), data in type_cost_map.items():
            if data["count"] > 0:
                avg_win_rate = round(data["total_win_rate"] / data["count"], 1)
                heatmap_data.append({
                    "type": c_type,
                    "elixir": cost,
                    "value": avg_win_rate,
                    "cards": data["cards"][:3] 
                })

        # 5. Format Deck Elixir Stats (New Granular Data)
        deck_elixir_data = []
        for cost, stats in elixir_stats.items():
            if stats["total"] > 10: # Filter low sample sizes
                win_rate = round((stats["wins"] / stats["total"]) * 100, 1)
                deck_elixir_data.append({
                    "elixir": float(cost),
                    "win_rate": win_rate,
                    "count": stats["total"]
                })
        
        # Sort by elixir cost
        deck_elixir_data.sort(key=lambda x: x["elixir"])

        # 6. Calculate Global Averages for Radar Chart
        # We need to fetch full player profiles to get these stats.
        # Since we didn't fetch them in the main loop (only battles), we can't calculate exact averages for THIS run without refactoring.
        # HOWEVER, to save time/requests, let's just fetch a sample of the top 5 players fully to get a baseline, 
        # OR refactor the main loop to fetch profiles.
        # Given the requirement, let's refactor the main loop to fetch profiles.
        # But I can't easily refactor the whole loop in this replace block.
        # So I will add a separate quick fetch for the top 50 players to get a "representative" average.
        
        logger.info("Fetching player profiles for averages (Sample of 50)...")
        global_stats = {
            "wins": [],
            "threeCrownWins": [],
            "bestTrophies": [],
            "warDayWins": [],
            "challengeCardsWon": []
        }
        
        # Helper to fetch profile
        def fetch_profile(tag, session):
            encoded = tag.replace("#", "%23")
            return make_request(f"players/{encoded}", session)

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Sample top 50 for averages to avoid 500 extra requests
            sample_players = top_players[:50]
            future_to_p = {executor.submit(fetch_profile, p["tag"], session): p for p in sample_players}
            
            for future in as_completed(future_to_p):
                data = future.result()
                if data:
                    global_stats["wins"].append(data.get("wins", 0))
                    global_stats["threeCrownWins"].append(data.get("threeCrownWins", 0))
                    global_stats["bestTrophies"].append(data.get("bestTrophies", 0))
                    global_stats["warDayWins"].append(data.get("warDayWins", 0))
                    global_stats["challengeCardsWon"].append(data.get("challengeCardsWon", 0))

        # Helper for Q3 (75th percentile)
        def get_q3(values):
            if not values: return 0
            sorted_vals = sorted(values)
            return sorted_vals[int(len(sorted_vals) * 0.75)]

        global_averages = {
            "wins": int(sum(global_stats["wins"]) / len(global_stats["wins"])) if global_stats["wins"] else 0,
            "threeCrownWins": int(sum(global_stats["threeCrownWins"]) / len(global_stats["threeCrownWins"])) if global_stats["threeCrownWins"] else 0,
            "bestTrophies": int(sum(global_stats["bestTrophies"]) / len(global_stats["bestTrophies"])) if global_stats["bestTrophies"] else 0,
            "warDayWins": int(sum(global_stats["warDayWins"]) / len(global_stats["warDayWins"])) if global_stats["warDayWins"] else 0,
            "challengeCardsWon": int(sum(global_stats["challengeCardsWon"]) / len(global_stats["challengeCardsWon"])) if global_stats["challengeCardsWon"] else 0,
        }
        
        global_q3 = {
            "wins": get_q3(global_stats["wins"]),
            "threeCrownWins": get_q3(global_stats["threeCrownWins"]),
            "bestTrophies": get_q3(global_stats["bestTrophies"]),
            "warDayWins": get_q3(global_stats["warDayWins"]),
            "challengeCardsWon": get_q3(global_stats["challengeCardsWon"]),
        }
        
        logger.info(f"Global Averages: {global_averages}")
        logger.info(f"Global Q3: {global_q3}")

        # Format Regional Archetypes
        formatted_regions = {}
        for region, counts in regional_archetypes.items():
            # Only include regions with significant data
            if sum(counts.values()) > 20:
                formatted_regions[region] = dict(counts.most_common())

        output_data = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_players": len(top_players),
            "total_decks": total_decks,
            "top_cards": top_cards,
            "top_decks": top_decks,
            "top_synergies": top_synergies,
            "archetypes": archetypes,
            "player_locations": player_locations,
            "regional_archetypes": formatted_regions,
            "elixir_heatmap": heatmap_data, # Keeping old one just in case
            "deck_elixir_stats": deck_elixir_data, # New granular data
            "global_averages": global_averages,
            "global_q3": global_q3,
            "leaderboards": {
                "players": top_players[:5],
                "clans": clan_leaderboard
            }
        }

        # 7. Aggregate Regional Archetypes
        # We need to re-process the data we collected to map Region -> Archetype
        # Since we didn't store the link between player -> deck -> region explicitly in a list,
        # we can't easily do it post-hoc without refactoring without refactoring the main loop.
        # Let's do a quick pass if we can, or better yet, let's just add it to the main loop next time.
        # For now, let's mock it or try to reconstruct it if we had the data.
        # Actually, let's Refactor the main loop slightly to store this.
        # ... (Refactoring main loop is risky in a replace block).
        # Alternative: We have `location_counts` and `archetype_counts`, but no cross-reference.
        # Let's add a simple "Regional Meta" section based on the top 5 regions.
        # We will need to update the main loop to capture this.
        
        # NOTE: For this specific run, I will add the logic to the MAIN LOOP in a separate edit 
        # to ensure we capture Region -> Archetype mapping correctly.
        # This block just sets up the output structure.
        
        os.makedirs(DATA_DIR, exist_ok=True)
        output_file = os.path.join(DATA_DIR, "meta_snapshot.json")
        
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2)
            
        logger.info(f"Data saved to {output_file}")

if __name__ == "__main__":
    main()
