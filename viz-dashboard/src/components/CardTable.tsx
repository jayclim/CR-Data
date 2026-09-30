import Image from 'next/image';
import Link from 'next/link';

interface Card {
  id: number;
  name: string;
  icon: string;
  usage_rate: number;
  win_rate?: number;
  elixir: number;
}

export default function CardTable({ cards }: { cards: Card[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_16px_32px_#030b1780]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--card-border)] bg-[#152942] px-4 py-3 sm:px-5">
        <h2 className="text-base font-bold text-[var(--foreground)]">Card statistics</h2>
        <span className="text-xs text-[var(--muted)] tabular-nums">Snapshot data</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[#0b1829] text-xs text-[var(--muted)]">
              <th className="px-4 py-3 font-semibold sm:px-5">Card</th>
              <th className="px-4 py-3 text-right font-semibold">Win %</th>
              <th className="px-4 py-3 text-right font-semibold sm:px-5">Use %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {cards.map((card, index) => (
              <tr key={index} className="transition-colors hover:bg-[#192d47]">
                <td className="px-4 py-2 sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-9 shrink-0 rounded-md border border-[#426183] bg-[#0b1829] shadow-[inset_0_1px_#7894aa33]">
                      <Image src={card.icon} alt={card.name} fill className="object-contain p-0.5" sizes="36px" />
                    </div>
                    <Link prefetch={false} href={`/explore?card=${card.id}`} className="text-sm font-semibold text-[var(--foreground)] underline decoration-[#426183] underline-offset-4 hover:text-[var(--primary)]">{card.name}</Link>
                  </div>
                </td>
                <td className="px-4 py-2 text-right text-sm font-bold text-[#54d6b5] tabular-nums">{card.win_rate ?? 0}%</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-[#48bdff] tabular-nums sm:px-5">{card.usage_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
