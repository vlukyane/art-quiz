import type { QuizMode } from "@/lib/leaderboard";

export type { QuizMode };

export const QUIZ_MODE_LIST: QuizMode[] = [
  "author",
  "title",
  "bio",
  "phraseologism",
  "flags",
];

export const MODE_CONFIG: Record<
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
  phraseologism: {
    title: "Угадай фразеологизм",
    description:
      "Показывается значение выражения — выберите фразеологизм из трёх вариантов. 30 вопросов без повторов.",
    questionLabel: "Какое это выражение?",
  },
  flags: {
    title: "Угадай страну по флагу",
    description:
      "Показывается флаг — выберите страну из трёх вариантов. 30 случайных флагов без повторов за игру.",
    questionLabel: "Какая это страна?",
  },
};
