"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import type { LeaderboardEntry, QuizMode } from "@/lib/leaderboard";
import { MODE_CONFIG, QUIZ_MODE_LIST } from "@/lib/modes";

export function LeaderboardPage() {
  const [activeMode, setActiveMode] = useState<QuizMode>("author");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async (mode: QuizMode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard?mode=${mode}`);
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as { entries: LeaderboardEntry[] };
      setEntries(data.entries);
    } catch {
      setError("Не удалось загрузить таблицу результатов");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard(activeMode);
  }, [activeMode, loadLeaderboard]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-stone-900">Таблица результатов</h1>
        <p className="mt-2 text-sm text-stone-600">Топ-20 лучших результатов по режимам</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {QUIZ_MODE_LIST.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setActiveMode(mode)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeMode === mode
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
            }`}
          >
            {MODE_CONFIG[mode].title}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      <LeaderboardTable entries={entries} loading={loading} />

      <Link
        href="/"
        className="mx-auto rounded-full border border-stone-300 px-8 py-3 text-center text-sm font-medium text-stone-700 transition hover:bg-stone-100"
      >
        ← Назад в меню
      </Link>
    </div>
  );
}
