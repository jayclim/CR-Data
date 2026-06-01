import { NextRequest, NextResponse } from 'next/server';

const CR_API_BASE = "https://proxy.royaleapi.dev/v1";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: pathArray } = await params;
    // Encode each segment to ensure special characters like # are preserved as %23
    const path = pathArray.map(segment => encodeURIComponent(segment)).join('/');
    const apiKey = process.env.CR_PROXY_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: "API Key not configured on server" },
            { status: 500 }
        );
    }

    // Get query parameters from the request url
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';

    const url = `${CR_API_BASE}/${path}${queryString}`;

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Accept": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, {
            // Cache successful responses at the CDN so repeated identical requests
            // serve from cache instead of re-running the function.
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { error: "Failed to fetch data from Clash Royale API" },
            { status: 500 }
        );
    }
}
