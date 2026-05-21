"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { ARTS } from "@/data/arts";
import {
  QUESTION_COUNT,
  buildAuthorOptions,
  getUniqueAuthors,
  pickGameArts,
} from "@/lib/quiz";

type GamePhase = "start" | "playing" | "finished";

export function ArtQuiz() {
  const allAuthors = useMemo(() => getUniqueAuthors(ARTS), []);

  const [phase, setPhase] = useState<GamePhase>("start");
  const [gameArts, setGameArts] = useState<typeof ARTS>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentArt = gameArts[questionIndex];
  const correctAuthor = currentArt?.author ?? "";

  const startGame = useCallback(() => {
    const arts = pickGameArts(ARTS, QUESTION_COUNT);
    setGameArts(arts);
    setQuestionIndex(0);
    setSelectedAuthor(null);
    setIsAnswered(false);
    setOptions(buildAuthorOptions(arts[0].author, allAuthors));
    setPhase("playing");
  }, [allAuthors]);

  const goToQuestion = useCallback(
    (index: number, arts: typeof ARTS) => {
      setQuestionIndex(index);
      setSelectedAuthor(null);
      setIsAnswered(false);
      setOptions(buildAuthorOptions(arts[index].author, allAuthors));
    },
    [allAuthors],
  );

  const handleAnswer = () => {
    if (!selectedAuthor || isAnswered) return;
    setIsAnswered(true);
  };

  const handleNext = () => {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= gameArts.length) {
      setPhase("finished");
      return;
    }
    goToQuestion(nextIndex, gameArts);
  };

  const getOptionClass = (author: string) => {
    const base =
      "flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors";

    if (!isAnswered) {
      return `${base} ${
        selectedAuthor === author
          ? "border-amber-600 bg-amber-50"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`;
    }

    if (author === correctAuthor) {
      return `${base} border-green-600 bg-green-50`;
    }

    if (author === selectedAuthor) {
      return `${base} border-red-600 bg-red-50`;
    }

    return `${base} border-stone-200 bg-white opacity-60`;
  };

  if (phase === "start") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900">Квиз: угадай художника</h1>
          <p className="mt-3 max-w-md text-stone-600">
            30 случайных картин из 100 знаменитых произведений. Выберите автора
            картины — каждая картина встречается только один раз за игру.
          </p>
        </div>
        <button
          type="button"
          onClick={startGame}
          className="rounded-full bg-stone-900 px-10 py-4 text-lg font-medium text-white transition hover:bg-stone-700"
        >
          Начать игру
        </button>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900">Игра завершена!</h2>
          <p className="mt-2 text-stone-600">
            Вы прошли все {QUESTION_COUNT} вопросов.
          </p>
        </div>
        <button
          type="button"
          onClick={startGame}
          className="rounded-full bg-stone-900 px-10 py-4 text-lg font-medium text-white transition hover:bg-stone-700"
        >
          Начать новую игру
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-8">
      <button
        type="button"
        onClick={startGame}
        className="absolute right-4 top-4 rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 transition hover:bg-stone-100"
        title="Начать игру заново"
      >
        ↻ Рестарт
      </button>

      <p className="mb-6 text-center text-sm text-stone-500">
        Вопрос {questionIndex + 1} из {QUESTION_COUNT}
      </p>

      {currentArt && (
        <div className="mb-6 overflow-hidden rounded-xl bg-stone-100 shadow-md">
          <div className="relative mx-auto aspect-[4/3] max-h-[420px] w-full">
            <Image
              src={currentArt.imgUrl}
              alt={currentArt.title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        </div>
      )}

      <fieldset className="space-y-3" disabled={isAnswered}>
        <legend className="mb-4 text-lg font-semibold text-stone-800">
          Кто автор этой картины?
        </legend>
        {options.map((author) => (
          <label key={author} className={getOptionClass(author)}>
            <input
              type="radio"
              name="author"
              value={author}
              checked={selectedAuthor === author}
              onChange={() => setSelectedAuthor(author)}
              disabled={isAnswered}
              className="h-4 w-4 accent-amber-700"
            />
            <span className="text-stone-800">{author}</span>
          </label>
        ))}
      </fieldset>

      <div className="mt-8 flex justify-center gap-4">
        {!isAnswered ? (
          <button
            type="button"
            onClick={handleAnswer}
            disabled={!selectedAuthor}
            className="rounded-full bg-amber-700 px-8 py-3 font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ответить
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full bg-stone-900 px-8 py-3 font-medium text-white transition hover:bg-stone-700"
          >
            {questionIndex + 1 >= QUESTION_COUNT ? "Завершить" : "Дальше"}
          </button>
        )}
      </div>
    </div>
  );
}
