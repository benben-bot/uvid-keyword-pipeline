import { NextRequest, NextResponse } from "next/server";
import { getKeywordStats } from "@/lib/naver-ads";
import { filterBySearchVolume, deduplicateKeywords, Keyword } from "@/lib/utils";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const seedKeywords: string[] = body.seedKeywords || [];

    if (seedKeywords.length === 0) {
      return NextResponse.json(
        { error: "seedKeywords가 필요합니다" },
        { status: 400 }
      );
    }

    // Expand via Naver Ads keywordstool (batched 5 at a time)
    const expanded = await getKeywordStats(seedKeywords);
    const filtered = filterBySearchVolume(deduplicateKeywords(expanded), 100);

    const tagged = filtered.map((kw) => ({
      ...kw,
      source: "step3-검색광고확장",
    }));

    return NextResponse.json({
      step: 3,
      name: "검색광고 API 키워드 확장",
      count: tagged.length,
      inputSeeds: seedKeywords.length,
      keywords: tagged,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
