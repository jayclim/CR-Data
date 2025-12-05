import os
import requests
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARDS_DIR = os.path.join(BASE_DIR, "public", "cards")

def download_image(url, filename):
    try:
        if os.path.exists(filename):
            return 
        response = requests.get(url)
        if response.status_code == 200:
            with open(filename, 'wb') as f:
                f.write(response.content)
    except Exception as e:
        logger.error(f"Failed to download image {url}: {e}")

def fetch_and_process_cards(session, api_base, headers):
    logger.info("Fetching all cards...")
    url = f"{api_base}/cards"
    
    try:
        response = session.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        logger.error(f"Failed to fetch cards: {e}")
        return {}
    
    if not data:
        return {}
    
    card_map = {}
    os.makedirs(CARDS_DIR, exist_ok=True)
    
    for card in data.get("items", []):
        name = card["name"]
        key = name.lower().replace(" ", "-").replace(".", "")
        
        # 1. Download Normal Icon
        icon_url = card.get("iconUrls", {}).get("medium")
        if icon_url:
            local_path = os.path.join(CARDS_DIR, f"{key}.png")
            download_image(icon_url, local_path)
            
        # 2. Download Evo Icon (if available)
        # API usually provides 'evolutionMedium' in iconUrls for evos
        evo_icon_url = card.get("iconUrls", {}).get("evolutionMedium")
        if evo_icon_url:
            local_path_evo = os.path.join(CARDS_DIR, f"{key}-evo.png")
            download_image(evo_icon_url, local_path_evo)
            
        # 3. Download Hero Icon (if available)
        # Assuming API provides 'heroMedium' or similar for heroes
        hero_icon_url = card.get("iconUrls", {}).get("heroMedium")
        if hero_icon_url:
            local_path_hero = os.path.join(CARDS_DIR, f"{key}-hero.png")
            download_image(hero_icon_url, local_path_hero)

        card_map[name] = {
            "id": card["id"],
            "name": name,
            "key": key,
            "elixir": card.get("elixirCost", 0),
            "type": card.get("type"),
            "rarity": card.get("rarity"),
            "icon": f"/cards/{key}.png",
            "evo_icon": f"/cards/{key}-evo.png" if evo_icon_url else None,
            "hero_icon": f"/cards/{key}-hero.png" if hero_icon_url else None
        }
        
    logger.info(f"Processed {len(card_map)} cards and assets.")
    return card_map

if __name__ == "__main__":
    # Standalone execution
    from dotenv import load_dotenv
    
    env_path = os.path.join(os.path.dirname(__file__), '../../mcp-server/.env')
    if not os.path.exists(env_path):
        env_path = os.path.join(os.path.dirname(__file__), '../../.env')
    load_dotenv(env_path)

    CR_API_KEY = os.getenv("CR_PROXY_API_KEY")
    if not CR_API_KEY:
        raise ValueError("CR_PROXY_API_KEY not found in environment variables")

    CR_API_BASE = "https://proxy.royaleapi.dev/v1"
    HEADERS = {"Authorization": f"Bearer {CR_API_KEY}"}

    with requests.Session() as session:
        fetch_and_process_cards(session, CR_API_BASE, HEADERS)
