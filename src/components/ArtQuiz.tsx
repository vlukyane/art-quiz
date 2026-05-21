"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { ARTS } from "@/data/arts";
import { getAuthorBio, getAuthorsWithBio } from "@/data/author-bios";
import { GameFinishedScreen } from "@/components/GameFinishedScreen";
import {
  QUESTION_COUNT,
  buildArtLabelOptions,
  buildAuthorOptions,
  formatArtLabel,
  getUniqueAuthors,
  pickGameArts,
  pickGameAuthors,
} from "@/lib/quiz";

type GamePhase = "start" | "playing" | "finished";
type QuizMode = "author" | "title" | "bio";

const MODES: Record<
  QuizMode,
  {
    title: string;
    description: string;
    questionLabel: string;
    inDevelopment?: boolean;
  }
> = {
  author: {
    title: "Угадай художника",
    description:
      "Показывается картина — выберите автора из трёх вариантов. 30 случайных картин без повторов за игру.",
    questionLabel: "Кто автор этой картины?",
  },
  title: {
    title: "Угадай картину по описанию",
    description:
      "Показывается описание картины — выберите название и автора из трёх вариантов. 30 вопросов без повторов.",
    questionLabel: "Как называется эта картина?",
    inDevelopment: true,
  },
  bio: {
    title: "Угадай художника по биографии",
    description:
      "Показывается биография — угадайте автора из трёх вариантов. 30 художников без повторов за игру.",
    questionLabel: "Кто этот художник?",
  },
};

function BioContent({ text }: { text: string }) {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className={
            paragraph.startsWith("Страна:") ||
            paragraph.startsWith("Город рождения:") ||
            paragraph.startsWith("Годы жизни:")
              ? "text-sm font-medium text-stone-600"
              : "text-base leading-relaxed text-stone-700"
          }
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function ArtQuiz() {
  const allAuthors = useMemo(() => getUniqueAuthors(ARTS), []);
  const authorsWithBio = useMemo(() => getAuthorsWithBio(), []);

  const [phase, setPhase] = useState<GamePhase>("start");
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [gameArts, setGameArts] = useState<typeof ARTS>([]);
  const [gameAuthors, setGameAuthors] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentArt = gameArts[questionIndex];
  const currentAuthor = gameAuthors[questionIndex];
  const currentBio =
    mode === "bio" && currentAuthor ? getAuthorBio(currentAuthor) : null;

  const correctAnswer =
    mode === "bio"
      ? (currentAuthor ?? "")
      : mode === "author"
        ? (currentArt?.author ?? "")
        : currentArt
          ? formatArtLabel(currentArt)
          : "";

  const buildOptionsForArt = useCallback(
    (art: (typeof ARTS)[number], quizMode: QuizMode) => {
      if (quizMode === "author") {
        return buildAuthorOptions(art.author, allAuthors);
      }
      return buildArtLabelOptions(art, ARTS);
    },
    [allAuthors],
  );

  const startGame = useCallback(
    (quizMode: QuizMode) => {
      setMode(quizMode);
      setQuestionIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setCorrectCount(0);

      if (quizMode === "bio") {
        const authors = pickGameAuthors(authorsWithBio, QUESTION_COUNT);
        setGameAuthors(authors);
        setGameArts([]);
        setOptions(buildAuthorOptions(authors[0], authorsWithBio));
      } else {
        const arts = pickGameArts(ARTS, QUESTION_COUNT);
        setGameArts(arts);
        setGameAuthors([]);
        setOptions(buildOptionsForArt(arts[0], quizMode));
      }

      setPhase("playing");
    },
    [authorsWithBio, buildOptionsForArt],
  );

  const restartGame = useCallback(() => {
    if (mode) startGame(mode);
  }, [mode, startGame]);

  const goToStart = () => {
    setPhase("start");
    setMode(null);
    setGameArts([]);
    setGameAuthors([]);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setOptions([]);
  };

  const goToQuestion = useCallback(
    (index: number, quizMode: QuizMode) => {
      setQuestionIndex(index);
      setSelectedAnswer(null);
      setIsAnswered(false);

      if (quizMode === "bio") {
        setOptions(buildAuthorOptions(gameAuthors[index], authorsWithBio));
      } else {
        setOptions(buildOptionsForArt(gameArts[index], quizMode));
      }
    },
    [authorsWithBio, buildOptionsForArt, gameArts, gameAuthors],
  );

  const handleAnswer = () => {
    if (!selectedAnswer || isAnswered) return;
    if (selectedAnswer === correctAnswer) {
      setCorrectCount((count) => count + 1);
    }
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (!mode) return;
    const nextIndex = questionIndex + 1;
    if (nextIndex >= QUESTION_COUNT) {
      setPhase("finished");
      return;
    }
    goToQuestion(nextIndex, mode);
  };

  const getOptionClass = (option: string) => {
    const base =
      "flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors";

    if (!isAnswered) {
      return `${base} ${
        selectedAnswer === option
          ? "border-amber-600 bg-amber-50"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`;
    }

    if (option === correctAnswer) {
      return `${base} border-green-600 bg-green-50`;
    }

    if (option === selectedAnswer) {
      return `${base} border-red-600 bg-red-50`;
    }

    return `${base} border-stone-200 bg-white opacity-60`;
  };

  const isPlayingReady =
    mode === "bio" ? currentAuthor && currentBio : currentArt;

  if (phase === "start") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900">Квиз: знаменитые картины</h1>
          <p className="mt-3 max-w-lg text-stone-600">
            Выберите режим игры — 30 случайных вопросов из 100 шедевров.
          </p>
        </div>
        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(MODES) as QuizMode[]).map((quizMode) => (
            <button
              key={quizMode}
              type="button"
              onClick={() => startGame(quizMode)}
              className="flex flex-col rounded-2xl border-2 border-stone-200 bg-white p-6 text-left transition hover:border-amber-600 hover:shadow-md"
            >
              <span className="text-lg font-semibold text-stone-900">
                {MODES[quizMode].title}
              </span>
              {MODES[quizMode].inDevelopment && (
                <span className="mt-2 inline-block w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  Режим в разработке
                </span>
              )}
              <span className="mt-2 text-sm leading-relaxed text-stone-600">
                {MODES[quizMode].description}
              </span>
              <span className="mt-4 text-sm font-medium text-amber-800">
                Начать →
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "finished" && mode) {
    return (
      <GameFinishedScreen
        mode={mode}
        modeTitle={MODES[mode].title}
        correctCount={correctCount}
        onRestart={restartGame}
        onGoToMenu={goToStart}
      />
    );
  }

  if (!mode || !isPlayingReady) return null;

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-8">
      <div className="absolute right-4 top-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={goToStart}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 transition hover:bg-stone-100"
          title="Вернуться в главное меню"
        >
          В меню
        </button>
        <button
          type="button"
          onClick={restartGame}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 transition hover:bg-stone-100"
          title="Начать игру заново"
        >
          ↻ Рестарт
        </button>
      </div>

      <p className="mb-2 text-center text-xs text-stone-400">{MODES[mode].title}</p>
      {MODES[mode].inDevelopment && (
        <p className="mb-2 text-center text-sm font-medium text-amber-700">
          Режим в разработке
        </p>
      )}
      <p className="absolute left-4 top-4 text-sm font-medium text-stone-600">
        Верно: {correctCount}
      </p>
      <p className="mb-6 text-center text-sm text-stone-500">
        Вопрос {questionIndex + 1} из {QUESTION_COUNT}
      </p>

      {mode === "author" && currentArt && (
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

      {mode === "title" && currentArt && (
        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-base leading-relaxed text-stone-700">
            {currentArt.description}
          </p>
        </div>
      )}

      {mode === "bio" && currentBio && (
        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <BioContent text={currentBio} />
        </div>
      )}

      <fieldset className="space-y-3" disabled={isAnswered}>
        <legend className="mb-4 text-lg font-semibold text-stone-800">
          {MODES[mode].questionLabel}
        </legend>
        {options.map((option) => (
          <label key={option} className={getOptionClass(option)}>
            <input
              type="radio"
              name="answer"
              value={option}
              checked={selectedAnswer === option}
              onChange={() => setSelectedAnswer(option)}
              disabled={isAnswered}
              className="mt-0.5 h-4 w-4 shrink-0 accent-amber-700"
            />
            <span className="text-stone-800">{option}</span>
          </label>
        ))}
      </fieldset>

      <div className="mt-8 flex justify-center gap-4">
        {!isAnswered ? (
          <button
            type="button"
            onClick={handleAnswer}
            disabled={!selectedAnswer}
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
