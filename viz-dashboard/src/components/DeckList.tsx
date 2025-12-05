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
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-blue-500">⚔️</span> Popular Decks
        </h2>
        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Top Meta Decks</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {decks.map((deck, index) => (
          <div key={index} className="bg-[#171717] border border-[#262626] rounded-lg overflow-hidden hover:border-[#404040] transition-colors group">
            {/* Deck Header Stats */}
            <div className="p-3 border-b border-[#262626] bg-[#1a1a1a]">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-bold text-gray-300">Deck Statistics</span>
                <span className="text-[#555] font-mono">#{index + 1}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wide text-gray-500">
                <div className="flex flex-col">
                  <span>Elixir</span>
                  <span className="text-pink-400 font-bold text-sm">{deck.avg_elixir}</span>
                </div>
                <div className="flex flex-col">
                  <span>Win Rate</span>
                  <span className="text-green-400 font-bold text-sm">{deck.win_rate}%</span>
                </div>
                <div className="flex flex-col">
                  <span>Usage</span>
                  <span className="text-blue-400 font-bold text-sm">{deck.usage_rate}%</span>
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="p-2 grid grid-cols-4 gap-1.5">
              {deck.cards.map((card, i) => (
                <div key={i} className="relative aspect-[3/4] bg-[#0a0a0a] rounded border border-[#262626] overflow-hidden">
                  <Image
                    src={card.icon}
                    alt={card.name}
                    fill
                    className="object-contain p-0.5"
                    sizes="(max-width: 768px) 25vw, 10vw"
                  />
                  <div className="absolute bottom-0 right-0 bg-black/80 text-[8px] px-1 text-gray-400 font-mono rounded-tl leading-tight">
                    {card.elixir}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Bar */}
            {/* <div className="px-2 pb-2">
               <button className="w-full text-[10px] bg-[#262626] text-gray-300 py-1.5 rounded hover:bg-[#333] transition-colors font-medium border border-[#333]">
                 View Details
               </button>
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
}
