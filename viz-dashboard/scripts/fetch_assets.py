import os
import requests
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Card icons are served directly from the RoyaleAPI CDN instead of being
# downloaded into /public and served by Vercel. Hot-linking the CDN keeps these
# images off our edge entirely (they don't count toward Vercel Edge Requests).
# URL scheme: https://cdn.royaleapi.com/static/img/cards-150/<slug>.png
#   - base icon: <slug>.png
#   - evolution: <slug>-ev1.png   (the API key uses "-evo", the CDN uses "-ev1")
#   - hero:      <slug>-hero.png
CDN_BASE = "https://cdn.royaleapi.com/static/img/cards-150"

def cdn_url(slug):
    return f"{CDN_BASE}/{slug}.png"

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

    for card in data.get("items", []):
        name = card["name"]
        key = name.lower().replace(" ", "-").replace(".", "")

        # Whether the API exposes evolution / hero variants for this card.
        has_evo = bool(card.get("iconUrls", {}).get("evolutionMedium"))
        has_hero = bool(card.get("iconUrls", {}).get("heroMedium"))

        card_map[name] = {
            "id": card["id"],
            "name": name,
            "key": key,
            "elixir": card.get("elixirCost", 0),
            "type": card.get("type"),
            "rarity": card.get("rarity"),
            "icon": cdn_url(key),
            "evo_icon": cdn_url(f"{key}-ev1") if has_evo else None,
            "hero_icon": cdn_url(f"{key}-hero") if has_hero else None
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
