import type { LeaderboardEntry } from "@/lib/leaderboard";

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
  highlightScore?: number;
  loading?: boolean;
};

export function LeaderboardTable({
  entries,
  highlightScore,
  loading,
}: LeaderboardTableProps) {
  if (loading) {
    return (
      <p className="py-4 text-center text-sm text-stone-500">Загрузка…</p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-stone-500">
        Пока нет записей. Станьте первым!
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-100 text-stone-600">
          <tr>
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Имя</th>
            <th className="px-3 py-2 text-right font-medium">Результат</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const isHighlighted =
              highlightScore !== undefined && entry.score === highlightScore;
            return (
              <tr
                key={entry.id}
                className={
                  isHighlighted
                    ? "bg-amber-50 font-medium"
                    : index % 2 === 0
                      ? "bg-white"
                      : "bg-stone-50/80"
                }
              >
                <td className="px-3 py-2 text-stone-500">{index + 1}</td>
                <td className="px-3 py-2 text-stone-800">{entry.name}</td>
                <td className="px-3 py-2 text-right text-stone-800">
                  {entry.score} / {entry.total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
