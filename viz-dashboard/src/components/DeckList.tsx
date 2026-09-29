import Image from 'next/image';

interface Card {
  name: string;
  icon: string;
  elixir: number;
  is_evo?: boolean;
  is_hero?: boolean;
}

interface Deck {
  cards: Card[];
  avg_elixir: number;
  count: number;
  usage_rate: number;
  win_rate: number;
}

export default function DeckList({ decks }: { decks: Deck[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="text-blue-500"></span> Popular Decks
        </h2>
        <span className="text-xs text-slate-500 normal-case font-bold tracking-normal">Ranked by observed usage</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck, index) => (
          <div key={index} className="bg-[#ffffff] border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-slate-400 transition-colors group">
            {/* Deck Header Stats */}
            <div className="p-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-bold text-slate-700">Deck sample</span>
                <span className="text-[#64748b] tabular-nums">#{index + 1}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs normal-case tracking-wide text-slate-500">
                <div className="flex flex-col">
                  <span>Elixir</span>
                  <span className="text-teal-700 font-bold text-sm">{deck.avg_elixir}</span>
                </div>
                <div className="flex flex-col">
                  <span>Win Rate</span>
                  <span className="text-emerald-700 font-bold text-sm">{deck.win_rate}%</span>
                </div>
                <div className="flex flex-col">
                  <span>Usage</span>
                  <span className="text-blue-700 font-bold text-sm">{deck.usage_rate}%</span>
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="p-2 grid grid-cols-4 gap-1.5">
              {deck.cards.map((card, i) => (
                <div key={i} className="relative aspect-[3/4] bg-[#f4f7fa] rounded border border-[#e2e8f0] overflow-hidden">
                  <Image
                    src={card.icon}
                    alt={card.name}
                    fill
                    className="object-contain p-0.5"
                    sizes="(max-width: 768px) 25vw, 10vw"
                  />
                  <div className="absolute bottom-0 right-0 bg-white/95 text-[10px] px-1 text-slate-600 tabular-nums rounded-tl leading-tight">
                    {card.elixir}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Bar */}
            {/* <div className="px-2 pb-2">
               <button className="w-full text-xs bg-[#e2e8f0] text-slate-700 py-1.5 rounded hover:bg-[#cbd5e1] transition-colors font-medium border border-[#cbd5e1]">
                 View Details
               </button>
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
}
