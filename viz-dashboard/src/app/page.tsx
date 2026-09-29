import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Network, Target, Globe2, Swords, Droplets } from 'lucide-react';
import MetaNetworkGraph from '@/components/MetaNetworkGraph';
import MetaScatterPlot from '@/components/meta/MetaScatterPlot';
import ElixirEfficiencyChart from '@/components/meta/ElixirEfficiencyChart';
import RegionalMetaMap from '@/components/meta/RegionalMetaMap';
import ArchetypeMatchupHeatmap from '@/components/meta/ArchetypeMatchupHeatmap';
import SnapshotNote from '@/components/SnapshotNote';
import metaData from '@/data/meta_snapshot.json';

const sections = [
  { icon: Network, id: 'dashboard', label: 'Card relationships' },
  { icon: Target, id: 'card-performance', label: 'Performance' },
  { icon: Droplets, id: 'tempo-analysis', label: 'Elixir' },
  { icon: Globe2, id: 'regional-playstyles', label: 'Regions' },
  { icon: Swords, id: 'archetype-matchups', label: 'Matchups' },
];

export default function Home() {
  return (
    <main className="page-shell">
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div>
          <h1 className="page-heading">Read the meta.<br />Find your next deck.</h1>
          <p className="section-copy mt-5">A closer look at the cards, combinations, and playstyles used by top Clash Royale players.</p>
        </div>
        <Link prefetch={false} href="/data" className="inline-flex items-center gap-3 bg-[#142a40] text-white px-5 py-3 rounded-lg text-sm font-medium">Explore cards & decks <ArrowRight size={16} /></Link>
      </div>
      <SnapshotNote />

      <nav aria-label="Analysis sections" className="flex flex-wrap gap-x-6 gap-y-3 my-7 text-sm text-slate-600">
        {sections.map(({ icon: Icon, id, label }) => <a key={id} href={`#${id}`} className="flex items-center gap-2 hover:text-blue-700"><Icon size={15} />{label}</a>)}
      </nav>

      <section id="dashboard" className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5 scroll-mt-24">
        <div className="h-[500px] sm:h-[570px] min-w-0"><MetaNetworkGraph synergies={metaData.top_synergies} /></div>
        <aside className="panel p-5">
          <h2 className="section-heading">Most played</h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">Card usage in this snapshot</p>
          <div className="space-y-4">
            {metaData.top_cards.slice(0, 6).map((card, i) => (
              <div key={card.id} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-3 tabular-nums">{i + 1}</span>
                <Image src={card.icon} alt={card.name} width={36} height={44} className="object-contain h-11 w-9" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 text-sm"><span className="font-medium truncate">{card.name}</span><span className="tabular-nums text-slate-500">{card.usage_rate}%</span></div>
                  <div className="h-1 bg-slate-100 rounded mt-2"><div className="h-1 rounded bg-blue-500" style={{ width: `${card.usage_rate}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
          <Link prefetch={false} href="/data#card-stats" className="flex items-center justify-between border-t border-slate-200 mt-6 pt-4 text-sm font-medium text-blue-700">View card statistics <ArrowRight size={15} /></Link>
        </aside>
      </section>
      <p className="text-xs text-slate-500 mt-3">Connections show cards played together, not a causal advantage. Drag cards or zoom to explore.</p>

      <section id="card-performance" className="mt-14 scroll-mt-24">
        <h2 className="section-heading">Popularity meets performance</h2>
        <p className="section-copy mt-2 mb-5">Compare card usage with observed wins, then explore how outcomes vary by deck cost. These are results from a selected player sample, not predictions.</p>
        <div className="grid xl:grid-cols-2 gap-5 items-start">
          <MetaScatterPlot cards={metaData.top_cards} />
          <div id="tempo-analysis" className="scroll-mt-24">
            <ElixirEfficiencyChart data={metaData.deck_elixir_stats} />
            <div className="mt-4 px-2 section-copy text-sm"><strong className="text-slate-800">Read with context.</strong> Popularity, player skill, deck composition, and sample size all affect win rates. Evolution and hero variants are pooled in card statistics.</div>
          </div>
        </div>
      </section>

      <section id="regional-playstyles" className="mt-14 scroll-mt-24">
        <RegionalMetaMap specificData={metaData.regional_archetypes_specific} genericData={metaData.regional_archetypes_generic}>
          <h2 className="section-heading mb-3">A world of playstyles</h2>
          <p className="section-copy">Explore deck archetypes across regions. Choose a country or region to compare the strategies represented in the sample.</p>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">Location comes from a player’s clan, not their residence. Only locations with more than 20 deck observations are included.</p>
        </RegionalMetaMap>
      </section>
      <section id="archetype-matchups" className="mt-14 scroll-mt-24">
        <ArchetypeMatchupHeatmap specificData={metaData.archetype_matchups_specific} genericData={metaData.archetype_matchups_generic} />
      </section>
      <footer className="mt-12 border-t border-slate-200 pt-6 section-copy text-xs">
        <p>About the sample: decisive 1v1 Ranked and Trophy Road deck observations from sampled top players. The same battle can appear from both players’ perspectives. Archetypes are heuristic categories; new cards may be unclassified.</p>
        <p className="mt-3">Independent fan project. Not affiliated with or endorsed by Supercell. Game artwork belongs to Supercell.</p>
      </footer>
    </main>
  );
}
