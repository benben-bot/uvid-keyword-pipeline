import { NextResponse } from "next/server";
import { SUNCARE_SUBCATEGORIES } from "@/lib/naver-datalab";
import { getKeywordStats } from "@/lib/naver-ads";
import { filterBySearchVolume, deduplicateKeywords } from "@/lib/utils";

export const maxDuration = 60;

export async function POST() {
  try {
    // Collect all seed keywords from subcategories
    const allSeeds: string[] = [];
    for (const sub of SUNCARE_SUBCATEGORIES) {
      allSeeds.push(...sub.seeds);
    }

    // Get search volume stats via Naver Ads API
    const keywords = await getKeywordStats(allSeeds);
    const filtered = filterBySearchVolume(deduplicateKeywords(keywords), 100);

    // Tag source
    const tagged = filtered.map((kw) => ({
      ...kw,
      source: "step1-쇼핑인사이트",
    }));

    return NextResponse.json({
      step: 1,
      name: "쇼핑인사이트 키워드 수집",
      count: tagged.length,
      keywords: tagged,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
