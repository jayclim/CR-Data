# Clash Royale Data Visualization Showcase

This project consists of two parts:
1. **Visualization Dashboard** (`viz-dashboard/`): A Next.js web application to display the data, plus the ETL scripts that snapshot it.
2. **MCP Server** (`mcp-server/`): A Python server exposing the Clash Royale API to MCP clients. Largely copied from [Baighasan/Chat-Royale](https://github.com/Baighasan/Chat-Royale), and **not used by the dashboard or the data pipeline** — see [NOTICE](NOTICE).

## Prerequisites
- **Python 3.10+**
- **Node.js 24+**
- **Clash Royale API Key**, set as `CR_PROXY_API_KEY` in `mcp-server/.env` (or in a `.env` at the repo root)

---

## 1. Running the MCP Server
The MCP server exposes the Clash Royale data to AI assistants or MCP clients.

1. Open a terminal and navigate to the server directory:
   ```bash
   cd mcp-server
   ```

2. Create a virtual environment (recommended) and activate it:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the dependencies:
   ```bash
   pip install -e .
   ```

4. **Test the Server**:
   You can use the MCP Inspector to test the server interactively.
   ```bash
   npx @modelcontextprotocol/inspector python src/main.py
   ```
   This will open a web interface where you can try out tools like `get_player_info`.

---

## 2. Running the Visualization Dashboard
The dashboard is a web app where you can view the data.

1. Open a **new terminal window** and navigate to the dashboard directory:
   ```bash
   cd viz-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and go to: [http://localhost:3000](http://localhost:3000)

---

## 3. Updating the Data
The dashboard displays a **static snapshot** of Clash Royale meta data. This ensures fast load times and no API rate limits for users.

To fetch fresh data (e.g., daily), use the provided update script:

1. Open your terminal in the project root.
2. Run the update script:
   ```bash
   ./update_data.sh
   ```
   
**What this does:**
1. Runs `viz-dashboard/scripts/fetch_meta.py` to fetch the latest top 1000 player battles and card stats.
2. Generates `meta_snapshot.json` and updates `meta_history.json` with the latest snapshot for the UTC day.
3. Automatically commits and pushes the new data to GitHub.
4. Triggers a redeploy on Vercel (if connected).

*Note: You need a valid `CR_PROXY_API_KEY` in `mcp-server/.env` for this to work.*

The GitHub workflow also refreshes these files daily at 11:00 UTC. The card explorer at `/explore` reads the saved data; browsing or selecting cards does not call the game API.

History retains 90 calendar days and starts with schema version 2. Older win-rate data is not backfilled. A same-day refresh replaces that day's point. Points summarize recent battle logs, which can overlap between days; they are not daily battle totals. Each sampled player's deck is counted once per identified battle, while matchup aggregation deduplicates both players' logs. Variants remain pooled, and these results describe the sampled ranked players rather than all players.

Run the offline data regression before changing the pipeline:

```bash
cd viz-dashboard
python3 scripts/test_snapshot.py
npm run test:history
```

The browser smoke check (`npm run test:explorer`) accepts `BASE_URL`, `PLAYWRIGHT_MODULE` (an existing Playwright installation), and `CHROME_BIN`. It verifies selection, deep links, empty search, responsive layout, and absence of game API calls.

---

## License

The dashboard, the ETL scripts, and the update tooling are MIT licensed — see
[LICENSE](LICENSE). `mcp-server/` is excluded from that grant because it is derived from
an upstream project that publishes no license; see [NOTICE](NOTICE) for details.

Clash Royale data and assets remain Supercell's property, used under the Supercell Fan
Content Policy. This project is not affiliated with or endorsed by Supercell.
