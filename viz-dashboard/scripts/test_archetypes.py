
import sys
import os

# Add script dir to path to import fetch_meta
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fetch_meta import determine_archetype, WIN_CONDITIONS, HEAVY_TANKS, SIEGE_BUILDINGS

def test_deck(name, cards, expected):
    # Mock card objects with names and costs
    # We need costs for feature vector (avg elixir, cycle score)
    # Simple map for costs of key cards used in tests
    costs = {
        "Golem": 8, "Lava Hound": 7, "Electro Giant": 7, "Goblin Giant": 6, "Giant": 5, "Royal Giant": 6,
        "P.E.K.K.A": 7, "Mega Knight": 7, "Royal Recruits": 7, "Three Musketeers": 9,
        "Balloon": 5, "Graveyard": 5, "Sparky": 6, "Bowler": 5, "Prince": 5, "Dark Prince": 4, 
        "Hog Rider": 4, "Battle Ram": 4, "Ram Rider": 5, "Royal Hogs": 5, "Elixir Golem": 3,
        "Miner": 3, "Goblin Barrel": 3, "Skeleton Barrel": 3, "Wall Breakers": 2, "Princess": 3,
        "X-Bow": 6, "Mortar": 4, "Goblin Drill": 4,
        "Musketeer": 4, "Electro Wizard": 4, "Ice Wizard": 3, "Baby Dragon": 4, "Hunter": 4,
        "Valkyrie": 4, "Knight": 3, "Mini P.E.K.K.A": 4, "Lumberjack": 4, "Bandit": 3, "Royal Ghost": 3, "Fisherman": 3,
        "Cannon": 3, "Tesla": 4, "Inferno Tower": 5, "Bomb Tower": 4, "Goblin Cage": 4, "Tombstone": 3,
        "Fireball": 4, "Poison": 4, "Rocket": 6, "Lightning": 6, "The Log": 2, "Zap": 2, "Arrows": 3, "Barbarian Barrel": 2,
        "Skeletons": 1, "Ice Spirit": 1, "Electro Spirit": 1, "Fire Spirit": 1, "Goblins": 2, "Spear Goblins": 2, "Bats": 2, "Goblin Gang": 3, "Skeleton Army": 3,
        "Tornado": 3, "Earthquake": 3
    }
    
    deck_cards = [{"name": c, "elixirCost": costs.get(c, 3)} for c in cards] # Default to 3 if unknown
    
    # Identify Win Condition logic (Duplicate from determining logic for debug display)
    card_names = set(c["name"] for c in deck_cards)
    primary_win_cons = [name for name in card_names if name in WIN_CONDITIONS]
    primary_win_cons.sort(key=lambda x: 10 if x in HEAVY_TANKS else (5 if x in SIEGE_BUILDINGS else 1), reverse=True)
    identified_win_con = primary_win_cons[0] if primary_win_cons else "None"

    # Result is now (Specific, Generic)
    specific, generic = determine_archetype(deck_cards)
    
    print(f"Deck: {name}")
    print(f"  Cards: {', '.join(cards)}")
    print(f"  Primary Win Con: {identified_win_con}")
    print(f"  Expected: {expected}")
    print(f"  Got:      {specific} / {generic}")
    
    # Allow partial match if result is more specific (e.g. "Golem" matches "Beatdown")
    # Check against Specific for verification
    match = specific == expected or expected in specific
    if match:
        print("  [PASS]")
    else:
        print("  [FAIL]")
    print("-" * 20)

def run_tests():
    # 1. Beatdown: Golem
    test_deck("Golem Beatdown", 
              ["Golem", "Night Witch", "Baby Dragon", "Lightning", "Tornado", "Mega Minion", "Lumberjack", "Barbarian Barrel"], 
              "Golem")

    # 2. Siege: X-Bow 3.0
    test_deck("X-Bow 3.0", 
              ["X-Bow", "Tesla", "Archers", "Knight", "Fireball", "The Log", "Skeletons", "Ice Spirit"], 
              "Siege (X-Bow)")

    # 3. Log Bait: Classic
    test_deck("Classic Log Bait", 
              ["Goblin Barrel", "Princess", "Goblin Gang", "Knight", "Inferno Tower", "Rocket", "Ice Spirit", "The Log"], 
              "Log Bait")

    # 4. Bridge Spam: Pekka BS
    test_deck("Pekka Bridge Spam", 
              ["P.E.K.K.A", "Battle Ram", "Bandit", "Royal Ghost", "Electro Wizard", "Magic Archer", "Zap", "Poison"], 
              "Pekka Bridge Spam")

    # 5. Cycle: Hog 2.6
    test_deck("Hog 2.6", 
              ["Hog Rider", "Musketeer", "Cannon", "Ice Golem", "Skeletons", "Ice Spirit", "Fireball", "The Log"], 
              "Hog Cycle")

    # 6. Control: SplashYard
    test_deck("SplashYard", 
              ["Graveyard", "Poison", "Ice Wizard", "Baby Dragon", "Tornado", "Valkyrie", "Tombstone", "Barbarian Barrel"], 
              "SplashYard")

    # 7. Hybrid: Miner Wall Breakers
    test_deck("Miner WB", 
              ["Miner", "Wall Breakers", "Magic Archer", "Bomb Tower", "Valkyrie", "Spear Goblins", "Fireball", "The Log"], 
              "Miner WB")

    # 8. Hybrid: Mortar Bait
    # Contains Mortar, Miner, Bait cards
    test_deck("Mortar Bait", 
              ["Mortar", "Miner", "Goblin Gang", "Spear Goblins", "Skeleton King", "Fireball", "The Log", "Cannon Cart"], 
              "Siege Hybrid") # Or Siege Bait

if __name__ == "__main__":
    run_tests()
