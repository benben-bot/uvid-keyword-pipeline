import { NextResponse } from "next/server";
import { generateSeedKeywords, AXES } from "@/lib/gemini";
import { getKeywordStats } from "@/lib/naver-ads";
import {
  filterBySearchVolume,
  deduplicateKeywords,
} from "@/lib/utils";

export const maxDuration = 60;

export async function POST() {
  try {
    // 모든 축을 병렬로 처리 (타임아웃 방지)
    const results = await Promise.allSettled(
      AXES.map((_, i) => generateSeedKeywords(i))
    );

    const allSeedKeywords: string[] = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        allSeedKeywords.push(...result.value);
      } else {
        console.error(`Claude axis ${i} error:`, result.reason);
      }
    });

    // Deduplicate seeds
    const uniqueSeeds = Array.from(new Set(allSeedKeywords.map((s) => s.replace(/\s+/g, ""))));

    // Get search volumes
    const keywords = await getKeywordStats(uniqueSeeds);
    const filtered = filterBySearchVolume(deduplicateKeywords(keywords), 100);

    const tagged = filtered.map((kw) => ({
      ...kw,
      source: "step2-Claude시드",
    }));

    return NextResponse.json({
      step: 2,
      name: "Claude AI 시드 키워드 생성",
      count: tagged.length,
      seedsGenerated: uniqueSeeds.length,
      keywords: tagged,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
