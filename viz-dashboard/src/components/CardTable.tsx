import Image from 'next/image';

interface Card {
  name: string;
  icon: string;
  usage_rate: number;
  win_rate?: number;
  elixir: number;
}

export default function CardTable({ cards }: { cards: Card[] }) {
  return (
    <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center">
        <h2 className="text-sm font-semibold text-slate-700 normal-case tracking-normal">Card statistics</h2>
        <span className="text-xs text-slate-500 tabular-nums">Snapshot data</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-xs text-slate-500 normal-case tracking-normal border-b border-[#e2e8f0]">
              <th className="px-3 py-2 font-medium">Card</th>
              <th className="px-3 py-2 font-medium text-right">Win %</th>
              <th className="px-3 py-2 font-medium text-right">Use %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {cards.map((card, index) => (
              <tr key={index} className="hover:bg-[#f1f5f9] transition-colors group">
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-10">
                      <Image
                        src={card.icon}
                        alt={card.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                      {card.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className="text-sm font-bold text-slate-800 tabular-nums">
                    {card.win_rate ?? 0}%
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className="text-sm font-bold text-slate-800 tabular-nums">
                    {card.usage_rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
