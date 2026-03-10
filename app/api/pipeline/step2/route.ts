import { NextResponse } from "next/server";
import { generateSeedKeywords, AXES } from "@/lib/gemini";
import { getKeywordStats } from "@/lib/naver-ads";
import {
  filterBySearchVolume,
  deduplicateKeywords,
  sleep,
} from "@/lib/utils";

export const maxDuration = 60;

export async function POST() {
  try {
    const allSeedKeywords: string[] = [];

    // Call Gemini for each of 12 axes
    for (let i = 0; i < AXES.length; i++) {
      try {
        const seeds = await generateSeedKeywords(i);
        allSeedKeywords.push(...seeds);
        await sleep(500); // Rate limiting
      } catch (err) {
        console.error(`Gemini axis ${i} error:`, err);
      }
    }

    // Deduplicate seeds
    const uniqueSeeds = Array.from(new Set(allSeedKeywords.map((s) => s.replace(/\s+/g, ""))));

    // Get search volumes
    const keywords = await getKeywordStats(uniqueSeeds);
    const filtered = filterBySearchVolume(deduplicateKeywords(keywords), 100);

    const tagged = filtered.map((kw) => ({
      ...kw,
      source: "step2-Gemini시드",
    }));

    return NextResponse.json({
      step: 2,
      name: "Gemini AI 시드 키워드 생성",
      count: tagged.length,
      seedsGenerated: uniqueSeeds.length,
      keywords: tagged,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
