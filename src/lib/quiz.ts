import type { Art } from "@/data/arts";

export const QUESTION_COUNT = 30;

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickGameArts(arts: Art[], count: number): Art[] {
  return shuffle(arts).slice(0, count);
}

export function getUniqueAuthors(arts: Art[]): string[] {
  return [...new Set(arts.map((art) => art.author))];
}

export function buildAuthorOptions(
  correctAuthor: string,
  allAuthors: string[],
): string[] {
  const wrongAuthors = shuffle(
    allAuthors.filter((author) => author !== correctAuthor),
  ).slice(0, 2);

  return shuffle([correctAuthor, ...wrongAuthors]);
}

export function formatArtLabel(art: Art): string {
  return `${art.author}, «${art.title}»`;
}

function artKey(art: Art): string {
  return `${art.author}\0${art.title}`;
}

export function buildArtLabelOptions(correctArt: Art, pool: Art[]): string[] {
  const correct = artKey(correctArt);
  const wrongArts = shuffle(pool.filter((art) => artKey(art) !== correct)).slice(
    0,
    2,
  );

  return shuffle([formatArtLabel(correctArt), ...wrongArts.map(formatArtLabel)]);
}
