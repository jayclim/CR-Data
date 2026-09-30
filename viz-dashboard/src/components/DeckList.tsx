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
      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <h2 className="text-xl font-bold text-[var(--foreground)]">Popular Decks</h2>
        <span className="text-xs text-[var(--muted)]">Ranked by observed usage</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck, index) => (
          <div key={index} className="group overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_16px_32px_#030b1780] transition-colors hover:border-[#48bdff]">
            <div className="border-b border-[var(--card-border)] bg-[#152942] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[var(--foreground)]">Deck sample</span>
                <span className="rounded-md border border-[#b88e3d] bg-[#4a3b23] px-2 py-0.5 text-xs font-black text-[#ffd166] tabular-nums">#{index + 1}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
                <div className="flex flex-col gap-0.5"><span>Elixir</span><span className="text-base font-bold text-[#48bdff] tabular-nums">{deck.avg_elixir}</span></div>
                <div className="flex flex-col gap-0.5"><span>Win rate</span><span className="text-base font-bold text-[#54d6b5] tabular-nums">{deck.win_rate}%</span></div>
                <div className="flex flex-col gap-0.5"><span>Usage</span><span className="text-base font-bold text-[#ffd166] tabular-nums">{deck.usage_rate}%</span></div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 p-3">
              {deck.cards.map((card, i) => (
                <div key={i} className={`relative aspect-[3/4] overflow-hidden rounded-md border bg-[linear-gradient(145deg,#25456b,#0b1829_75%)] shadow-[inset_0_1px_#ffffff38,0_3px_0_#07111f] ${card.is_evo ? 'border-[#ba7dff]' : card.is_hero ? 'border-[#ffd166]' : 'border-[#426183]'}`}>
                  <Image src={card.icon} alt={card.name} fill className="object-contain p-0.5" sizes="(max-width: 768px) 25vw, 10vw" />
                  <span className="absolute bottom-0 right-0 rounded-tl-md border-l border-t border-[#426183] bg-[#081321]/95 px-1.5 text-[10px] font-bold leading-4 text-[#eaf4ff] tabular-nums">{card.elixir}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
