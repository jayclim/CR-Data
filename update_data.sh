#!/bin/bash

# 1. Run the Python script to fetch new data
echo "Fetching new data from Clash Royale..."
python3 viz-dashboard/scripts/fetch_meta.py

# 2. Check if the script succeeded (exit code 0)
if [ $? -eq 0 ]; then
    echo "Data fetch successful!"
    
    # 3. Add the new data files to git
    git add viz-dashboard/src/data/meta_snapshot.json viz-dashboard/src/data/meta_history.json
    
    # 4. Commit the changes
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    git commit -m "chore: update meta data ($timestamp)"
    
    # 5. Push to GitHub (triggers Vercel deploy)
    echo "Pushing to GitHub..."
    git push
    
    echo "Done! Vercel should be deploying the new data now."
else
    echo "Error: Data fetch failed. Please check your API key and internet connection."
    exit 1
fi
