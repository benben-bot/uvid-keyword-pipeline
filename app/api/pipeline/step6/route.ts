import { NextRequest, NextResponse } from "next/server";
import { getKeywordStats } from "@/lib/naver-ads";
import {
  filterBySearchVolume,
  deduplicateKeywords,
  chunkArray,
  Keyword,
} from "@/lib/utils";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const allKeywords: Keyword[] = body.keywords || [];

    // Deduplicate first
    const deduplicated = deduplicateKeywords(allKeywords);

    // Collect keywords that need search volume lookup
    const needsLookup = deduplicated.filter(
      (kw) => kw.totalSearchCount === 0
    );
    const hasVolume = deduplicated.filter(
      (kw) => kw.totalSearchCount > 0
    );

    // Batch lookup in chunks of 500 (5 keywords per API call × 100 batches)
    const lookupKeywords = needsLookup.map((kw) => kw.keyword);
    const chunks = chunkArray(lookupKeywords, 500);
    const lookedUp: Keyword[] = [];

    for (const chunk of chunks) {
      const results = await getKeywordStats(chunk);
      lookedUp.push(...results);
    }

    // Merge results
    const merged = [...hasVolume, ...lookedUp];
    const finalDeduped = deduplicateKeywords(merged);
    const finalFiltered = filterBySearchVolume(finalDeduped, 100);

    // Sort by total search count descending
    finalFiltered.sort((a, b) => b.totalSearchCount - a.totalSearchCount);

    return NextResponse.json({
      step: 6,
      name: "최종 합산 & 중복제거",
      count: finalFiltered.length,
      beforeDedup: allKeywords.length,
      afterDedup: deduplicated.length,
      keywords: finalFiltered,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
