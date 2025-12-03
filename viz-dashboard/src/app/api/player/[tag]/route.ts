import { NextResponse } from 'next/server';

const CR_API_BASE = "https://proxy.royaleapi.dev/v1";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ tag: string }> }
) {
    const { tag } = await params;

    if (!tag) {
        return NextResponse.json({ error: "Tag is required" }, { status: 400 });
    }

    // Ensure tag has # and is encoded
    let formattedTag = tag.toUpperCase();
    if (!formattedTag.startsWith("#")) {
        formattedTag = `#${formattedTag}`;
    }
    const encodedTag = formattedTag.replace("#", "%23");

    const apiKey = process.env.CR_PROXY_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "Server configuration error: API Key missing" }, { status: 500 });
    }

    try {
        const headers = {
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "application/json"
        };

        const [profileRes, battleLogRes, chestsRes] = await Promise.all([
            fetch(`${CR_API_BASE}/players/${encodedTag}`, { headers, next: { revalidate: 60 } }),
            fetch(`${CR_API_BASE}/players/${encodedTag}/battlelog`, { headers, next: { revalidate: 60 } }),
            fetch(`${CR_API_BASE}/players/${encodedTag}/upcomingchests`, { headers, next: { revalidate: 600 } }) // Cache chests longer
        ]);

        if (!profileRes.ok) {
            if (profileRes.status === 404) {
                return NextResponse.json({ error: "Player not found" }, { status: 404 });
            }
            return NextResponse.json(
                { error: `API Error: ${profileRes.statusText}` },
                { status: profileRes.status }
            );
        }

        const profile = await profileRes.json();
        const battleLog = battleLogRes.ok ? await battleLogRes.json() : [];
        const chests = chestsRes.ok ? await chestsRes.json() : {};

        return NextResponse.json({
            ...profile,
            battleLog: battleLog,
            upcomingChests: chests.items || [],
        });

    } catch (error) {
        console.error("Failed to fetch player data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
