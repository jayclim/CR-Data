# Dashboard refresh

Use a light analytics design: white panels, slate canvas (#f4f7fa), navy ink (#142a40), blue (#2563eb), teal (#087f72), and amber (#ad6500). System typography keeps text fast and readable. The card artwork supplies the personality; no decorative gradients, neon effects, or invented statistics.

Keep the existing chart tools and navigation. Lead with snapshot date and sample size, then a card relationship graph and popular cards. Follow with usage/outcome, elixir, regional and matchup analysis. Tables and controls remain available on narrow screens. Search pages clearly explain their unavailable state.

Reduce requests with opt-out link prefetching, direct links to static search pages, lazy card images and no decorative asset requests. Configure Vercel bot protections separately from application code. Preserve search API gates.

Correct card/deck win rates and duplicate counters in the existing pipeline, retain the last snapshot on failure, use API-provided artwork, and refresh from the current game API. Describe data as a sample with limitations, never live or a guarantee of future performance.

Validation: offline pipeline regression; production build; browser navigation, charts, mobile overflow, assets and prefetch inspection; inspect live deployment and firewall independently. No new runtime dependencies.
