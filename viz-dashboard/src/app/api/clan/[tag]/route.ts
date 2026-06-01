import { NextResponse } from 'next/server';

const CR_API_BASE = "https://proxy.royaleapi.dev/v1";

// Live clan lookups are disabled by default to protect the Vercel function /
// edge-compute quota — each call is an upstream API request + function invocation.
// Re-enable by setting SEARCH_API_ENABLED=true in the Vercel project env.
const SEARCH_API_ENABLED = process.env.SEARCH_API_ENABLED === "true";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ tag: string }> }
) {
    if (!SEARCH_API_ENABLED) {
        return NextResponse.json(
            { error: "Clan search is currently disabled." },
            { status: 503 }
        );
    }

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

        // Fetch Clan Details (includes member list)
        const response = await fetch(`${CR_API_BASE}/clans/${encodedTag}`, {
            headers,
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: "Clan not found" }, { status: 404 });
            }
            return NextResponse.json(
                { error: `API Error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, {
            // Cache successful responses at the CDN so repeated lookups of the same
            // clan serve from cache instead of re-running the function.
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });

    } catch (error) {
        console.error("Failed to fetch clan data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
