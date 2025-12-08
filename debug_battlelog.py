import requests
import json
import os
from dotenv import load_dotenv

load_dotenv("mcp-server/.env")
api_key = os.getenv("CR_PROXY_API_KEY")
headers = {"Authorization": f"Bearer {api_key}"}

# Use a known top player tag or the one from the dashboard if visible (I'll use a placeholder or try to find one)
# Let's try to list players from the meta snapshot if possible, or just pick a random top player tag.
# I'll use a hardcoded tag for a popular player or just fetch top players to get a valid tag.

def get_top_players():
    url = "https://proxy.royaleapi.dev/v1/locations/global/pathoflegend/players"
    r = requests.get(url, headers=headers, params={"limit": 10})
    if r.status_code == 200:
        return [p["tag"] for p in r.json()["items"]]
    return []

tags = get_top_players()
print(f"Checking {len(tags)} players")

for tag in tags:
    print(f"\nChecking player {tag}")
    url = f"https://proxy.royaleapi.dev/v1/players/{tag.replace('#', '%23')}/battlelog"
    r = requests.get(url, headers=headers)
    if r.status_code != 200: continue
    
    data = r.json()
    for i, battle in enumerate(data):
        team = battle.get('team', [])
        for p in team:
            cards = p.get('cards', [])
            for c in cards:
                if "Tower" in c['name'] or "Cannoneer" in c['name'] or "Duchess" in c['name']:
                    print(f"FOUND TOWER TROOP: {c['name']} in Battle {i} (Mode: {battle.get('gameMode', {}).get('name')})")
                    print(f"  Total cards in this player's list: {len(cards)}")
        
        if len(team) == 1: # 1v1
            cards = team[0].get('cards', [])
            if len(cards) > 8:
                 mode = battle.get('gameMode', {}).get('name', 'Unknown')
                 print(f"  MATCH FOUND! Battle {i} Mode: {mode}, Cards: {len(cards)}")
                 for c in cards:
                     print(f"    - {c['name']}")
                 # Break after finding one example per player to save output space
                 break
