import type { ObjectId } from "mongodb";

export type QuizMode = "author" | "title" | "bio";

export const LEADERBOARD_SIZE = 20;

export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  total: number;
  mode: QuizMode;
  createdAt: string;
};

export type LeaderboardDocument = {
  _id?: ObjectId;
  name: string;
  score: number;
  total: number;
  mode: QuizMode;
  createdAt: Date;
};

export const LEADERBOARD_COLLECTION = "leaderboard";

export function scoreQualifiesForTop(
  score: number,
  entries: Pick<LeaderboardEntry, "score">[],
): boolean {
  if (entries.length < LEADERBOARD_SIZE) return true;
  const cutoff = entries[entries.length - 1]?.score ?? 0;
  return score >= cutoff;
}

export function toLeaderboardEntry(doc: LeaderboardDocument): LeaderboardEntry {
  return {
    id: doc._id!.toString(),
    name: doc.name,
    score: doc.score,
    total: doc.total,
    mode: doc.mode,
    createdAt: doc.createdAt.toISOString(),
  };
}
