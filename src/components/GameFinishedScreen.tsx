"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeaderboardEntry, QuizMode } from "@/lib/leaderboard";
import { QUESTION_COUNT } from "@/lib/quiz";
import { LeaderboardTable } from "@/components/LeaderboardTable";

type GameFinishedScreenProps = {
  mode: QuizMode;
  modeTitle: string;
  correctCount: number;
  onRestart: () => void;
  onGoToMenu: () => void;
};

export function GameFinishedScreen({
  mode,
  modeTitle,
  correctCount,
  onRestart,
  onGoToMenu,
}: GameFinishedScreenProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [qualifies, setQualifies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/leaderboard?mode=${mode}&score=${correctCount}`,
      );
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as {
        entries: LeaderboardEntry[];
        qualifies?: boolean;
      };
      setEntries(data.entries);
      setQualifies(data.qualifies ?? false);
    } catch {
      setError("Не удалось загрузить таблицу лидеров");
    } finally {
      setLoading(false);
    }
  }, [mode, correctCount]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleSave = async () => {
    const name = playerName.trim();
    if (!name || saving || saved) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          score: correctCount,
          total: QUESTION_COUNT,
          mode,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "save failed");
      }

      const data = (await res.json()) as { entries: LeaderboardEntry[] };
      setEntries(data.entries);
      setSaved(true);
      setQualifies(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить результат",
      );
    } finally {
      setSaving(false);
    }
  };

  const showSaveForm = qualifies && !saved;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-10">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-stone-900">Игра завершена!</h2>
        <p className="mt-2 text-stone-600">
          Режим «{modeTitle}» — все {QUESTION_COUNT} вопросов пройдены.
        </p>
        <p className="mt-6 text-4xl font-bold text-stone-900">
          {correctCount} из {QUESTION_COUNT}
        </p>
        <p className="mt-2 text-lg text-stone-600">правильных ответов</p>
        <p className="mt-1 text-sm text-stone-500">
          {Math.round((correctCount / QUESTION_COUNT) * 100)}%
        </p>
      </div>

      {showSaveForm && (
        <div className="w-full rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
          <p className="text-center font-semibold text-amber-900">
            Вы в топ-20! Сохраните результат
          </p>
          <p className="mt-1 text-center text-sm text-amber-800">
            Введите имя для таблицы лидеров
          </p>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={24}
            placeholder="Ваше имя"
            className="mt-4 w-full rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-stone-900 outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!playerName.trim() || saving}
            className="mt-3 w-full rounded-full bg-amber-700 py-3 font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Сохранение…" : "Сохранить результат"}
          </button>
        </div>
      )}

      {saved && (
        <p className="text-center text-sm font-medium text-green-700">
          Результат сохранён в таблице лидеров!
        </p>
      )}

      <div className="w-full">
        <h3 className="mb-3 text-center text-lg font-semibold text-stone-800">
          Таблица лидеров
        </h3>
        {error && (
          <p className="mb-2 text-center text-sm text-red-600">{error}</p>
        )}
        <LeaderboardTable
          entries={entries}
          highlightScore={saved ? correctCount : undefined}
          loading={loading}
        />
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="rounded-full bg-stone-900 px-10 py-4 text-lg font-medium text-white transition hover:bg-stone-700"
      >
        Начать новую игру
      </button>
      <button
        type="button"
        onClick={onGoToMenu}
        className="text-sm text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
      >
        Выбрать другой режим
      </button>
    </div>
  );
}
