import { NextRequest, NextResponse } from "next/server";
import { sleep, Keyword } from "@/lib/utils";

export const maxDuration = 60;

async function getAutoComplete(query: string): Promise<string[]> {
  const url = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(
    query
  )}&con=1&frm=mobile_nv&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&ans=2&run=2&rev=4&q_enc=UTF-8`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items?.[0] || [];
    return items.map((item: string[]) => item[0]?.replace(/\s+/g, "") || "").filter(Boolean);
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const seedKeywords: string[] = body.seedKeywords || [];
    const limit = Math.min(seedKeywords.length, 50); // Top seeds only

    const topSeeds = seedKeywords.slice(0, limit);
    const allSuggestions: string[] = [];

    for (const seed of topSeeds) {
      const suggestions = await getAutoComplete(seed);
      allSuggestions.push(...suggestions);
      await sleep(200); // 0.2s delay per request
    }

    // Deduplicate
    const unique = Array.from(new Set(allSuggestions));

    return NextResponse.json({
      step: 4,
      name: "자동완성 키워드 (롱테일)",
      count: unique.length,
      inputSeeds: topSeeds.length,
      keywords: unique.map((kw) => ({
        keyword: kw,
        monthlyPcQcCnt: 0,
        monthlyMobileQcCnt: 0,
        totalSearchCount: 0,
        compIdx: "-",
        source: "step4-자동완성",
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
