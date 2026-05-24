import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import {
  LEADERBOARD_COLLECTION,
  LEADERBOARD_SIZE,
  type LeaderboardDocument,
  type QuizMode,
  scoreQualifiesForTop,
  toLeaderboardEntry,
} from "@/lib/leaderboard";
import { QUIZ_MODE_LIST } from "@/lib/modes";

function isValidMode(mode: string | null): mode is QuizMode {
  return mode !== null && QUIZ_MODE_LIST.includes(mode as QuizMode);
}

async function getCollection() {
  const client = await getMongoClient();
  return client.db().collection<LeaderboardDocument>(LEADERBOARD_COLLECTION);
}

async function fetchTopForMode(mode: QuizMode) {
  const collection = await getCollection();
  const docs = await collection
    .find({ mode })
    .sort({ score: -1, createdAt: 1 })
    .limit(LEADERBOARD_SIZE)
    .toArray();

  return docs.map(toLeaderboardEntry);
}

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode");
    if (!isValidMode(mode)) {
      return NextResponse.json(
        { error: "Invalid mode" },
        { status: 400 },
      );
    }

    const entries = await fetchTopForMode(mode);
    const scoreParam = request.nextUrl.searchParams.get("score");

    const body: {
      entries: typeof entries;
      qualifies?: boolean;
    } = { entries };

    if (scoreParam !== null) {
      const parsedScore = Number.parseInt(scoreParam, 10);
      if (!Number.isFinite(parsedScore) || parsedScore < 0) {
        return NextResponse.json(
          { error: "Invalid score" },
          { status: 400 },
        );
      }
      body.qualifies = scoreQualifiesForTop(parsedScore, entries);
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error("Leaderboard GET error:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      score?: number;
      total?: number;
      mode?: string;
    };

    const name = body.name?.trim().slice(0, 24);
    const score = body.score;
    const total = body.total;
    const modeParam = body.mode ?? null;

    if (!name || name.length < 1) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    if (!isValidMode(modeParam)) {
      return NextResponse.json(
        { error: "Invalid mode" },
        { status: 400 },
      );
    }

    if (
      typeof score !== "number" ||
      !Number.isFinite(score) ||
      score < 0 ||
      typeof total !== "number" ||
      !Number.isFinite(total)
    ) {
      return NextResponse.json(
        { error: "Invalid score" },
        { status: 400 },
      );
    }

    const entries = await fetchTopForMode(modeParam);

    if (!scoreQualifiesForTop(score, entries)) {
      return NextResponse.json(
        { error: "Результат не попадает в топ-20" },
        { status: 403 },
      );
    }

    const collection = await getCollection();

    await collection.insertOne({
      name,
      score,
      total,
      mode: modeParam,
      createdAt: new Date(),
    });

    const all = await collection
      .find({ mode: modeParam })
      .sort({ score: -1, createdAt: 1 })
      .toArray();

    if (all.length > LEADERBOARD_SIZE) {
      const excess = all.slice(LEADERBOARD_SIZE);
      await collection.deleteMany({
        _id: { $in: excess.map((doc) => doc._id!) },
      });
    }

    const updated = await fetchTopForMode(modeParam);

    return NextResponse.json({ entries: updated });
  } catch (error) {
    console.error("Leaderboard POST error:", error);
    return NextResponse.json(
      { error: "Failed to save result" },
      { status: 500 },
    );
  }
}
