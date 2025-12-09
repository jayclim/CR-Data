import React from 'react';
import BentoGrid from "@/components/BentoGrid";
import MetaScatterPlot from '@/components/meta/MetaScatterPlot';
import ElixirEfficiencyChart from '@/components/meta/ElixirEfficiencyChart';
import RegionalMetaMap from '@/components/meta/RegionalMetaMap';
import ArchetypeMatchupHeatmap from '@/components/meta/ArchetypeMatchupHeatmap';
import PageNavigation from '@/components/PageNavigation';
import metaData from '@/data/meta_snapshot.json';

export default function Home() {
  const { top_synergies, player_locations, total_players, total_decks, archetypes } = metaData;
  
  // Find top archetype
  const topArchetype = archetypes && archetypes.length > 0 && archetypes[0] ? archetypes[0].name : "Unknown";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Meta Deep Dive
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Going beyond simple win rates. We analyzed {metaData.total_decks} decks from the world&apos;s top players to answer three critical questions about the current state of Clash Royale.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 uppercase tracking-wide font-bold pt-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Live Analysis: {metaData.total_players} Top Players • {metaData.total_decks} Battles</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 relative">
          {/* Main Content */}
          <div className="flex-1 space-y-16 min-w-0">
            
            {/* Bento Grid Dashboard (Visualizations) */}
            <section id="dashboard" className="scroll-mt-24 space-y-6">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-blue-500">1.</span> The Meta Web
              </h2>
              <p className="text-gray-400 mb-4 max-w-3xl">
                A high-level overview of the current meta. Explore the most powerful card synergies, deck archetypes, and global player distribution.
              </p>
              <BentoGrid 
                synergies={top_synergies || []} 
                playerLocations={player_locations || []}
                stats={{
                  totalPlayers: total_players,
                  totalDecks: total_decks,
                  topArchetype: topArchetype
                }}
              />
            </section>

            <div className="w-full h-px bg-[#262626]" />

            {/* Story 2: The Sleeper Hunt */}
            <section id="sleeper-hunt" className="space-y-4 scroll-mt-24">
              <div className="flex flex-col xl:flex-row gap-8 items-start">
                <div className="w-full xl:w-1/3">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-purple-500">2.</span> The Sleeper Hunt
                  </h2>
                  <p className="text-gray-400 mb-4">
                    Everyone knows the meta cards, but where are the hidden gems? We plotted every card&apos;s 
                    <span className="text-white font-bold"> Win Rate</span> against its <span className="text-white font-bold">Usage Rate</span>.
                    Cards in the top-left quadrant (High Win, Low Usage) are your &quot;Sleeper Picks&quot; — statistically strong but underplayed.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500 list-disc list-inside mb-6">
                    <li><span className="text-green-500 font-bold">Top Right:</span> Meta Staples (Safe picks)</li>
                    <li><span className="text-purple-500 font-bold">Top Left:</span> Sleepers (High skill ceiling / Surprise factor)</li>
                    <li><span className="text-red-500 font-bold">Bottom Right:</span> Overrated (Popular but losing)</li>
                  </ul>
                </div>
                <div className="w-full xl:w-2/3">
                  <MetaScatterPlot cards={metaData.top_cards} />
                </div>
              </div>
            </section>

            <div className="w-full h-px bg-[#262626]" />

            {/* Story 3: Tempo Analysis */}
            <section id="tempo-analysis" className="space-y-4 scroll-mt-24">
              <div className="flex flex-col xl:flex-row-reverse gap-8 items-start">
                <div className="w-full xl:w-1/3">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-yellow-500">3.</span> The Tempo Analysis
                  </h2>
                  <p className="text-gray-400 mb-4">
                    Does playing faster decks actually lead to more wins? We analyzed the average win rate for decks at different 
                    <span className="text-white font-bold"> Elixir Costs</span>.
                  </p>
                  <p className="text-gray-400 text-sm">
                    In the current meta, we often see a &quot;sweet spot&quot; where cycle decks (low elixir) outperform heavier beatdown decks due to their ability to out-cycle counters.
                  </p>
                </div>
                <div className="w-full xl:w-2/3">
                  <ElixirEfficiencyChart data={metaData.deck_elixir_stats} />
                </div>
              </div>
            </section>

            <div className="w-full h-px bg-[#262626]" />

            {/* Story 4: Regional Playstyles */}
            <section id="regional-playstyles" className="space-y-6 scroll-mt-24">
              <RegionalMetaMap data={metaData.regional_archetypes}>
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-500">4.</span> Regional Playstyles
                  </h2>
                  <p className="text-gray-400 mb-4 text-lg">
                    Do players from different regions favor different strategies? We aggregated deck archetypes by the clan location of top players.
                  </p>
                  <p className="text-gray-500 text-sm italic">
                    This data reveals cultural meta differences. For example, some regions might heavily favor &quot;Bridge Spam&quot; aggression, while others prefer calculated &quot;Control&quot; decks.
                  </p>
                </div>
            </RegionalMetaMap>
            </section>

            <div className="w-full h-px bg-[#262626]" />

            {/* Story 5: Archetype Matchups */}
            <section id="archetype-matchups" className="space-y-6 scroll-mt-24">
              <div className="flex flex-col xl:flex-row-reverse gap-8 items-start">
                <div className="w-full xl:w-1/3">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-red-500">5.</span> Direct Counters
                  </h2>
                  <p className="text-gray-400 mb-4">
                    Is there a true &quot;Rock Paper Scissors&quot; dynamic? We analyzed thousands of battles to find which archetypes statistically counter others.
                  </p>
                  <p className="text-gray-500 text-sm italic">
                    Grid cells show the win rate of the <span className="font-bold text-white">Row Archetype</span> vs the <span className="font-bold text-white">Column Opponent</span>.
                    <br/><br/>
                    Significant counters (Z-score &gt; 1.96) are highlighted fully opaque.
                  </p>
                </div>
                <div className="w-full xl:w-2/3">
                  <ArchetypeMatchupHeatmap data={metaData.archetype_matchups || []} />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <PageNavigation />
          </div>
        </div>
      </div>
    </main>
  );
}
