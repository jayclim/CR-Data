
interface Card {
    name: string;
    id?: number;
}

export const WIN_CONDITIONS = {
    "Beatdown": ["Golem", "Lava Hound", "Giant", "Electro Giant", "Goblin Giant", "Royal Giant", "Elixir Golem"],
    "Siege": ["X-Bow", "Mortar"],
    "Control": ["Miner", "Graveyard", "Goblin Barrel", "Wall Breakers", "Skeleton Barrel"],
    "Cycle": ["Hog Rider", "Royal Hogs", "Ram Rider", "Battle Ram"],
    "Bridge Spam": ["P.E.K.K.A", "Mega Knight", "Elite Barbarians", "Royal Recruits"],
    "Air": ["Balloon"],
    "Three Musketeers": ["Three Musketeers"]
};

export function getArchetype(cards: (Card | { name: string })[]): string {
    const cardNames = cards.map(c => c.name);

    for (const [archetype, conditions] of Object.entries(WIN_CONDITIONS)) {
        if (conditions.some(wc => cardNames.includes(wc))) {
            return archetype;
        }
    }

    return "Unknown";
}

export const CARD_RARITY_COLORS = {
    "Common": "#3b82f6", // Blue
    "Rare": "#f97316",   // Orange
    "Epic": "#a855f7",   // Purple
    "Legendary": "#ec4899", // Pink/Rainbowish
    "Champion": "#eab308"   // Gold
};
