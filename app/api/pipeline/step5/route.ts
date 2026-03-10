import { NextRequest, NextResponse } from "next/server";
import { sleep } from "@/lib/utils";

export const maxDuration = 60;

async function getMobileRelated(query: string): Promise<string[]> {
  try {
    const url = `https://m.search.naver.com/search.naver?where=m&query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });

    if (!res.ok) return [];
    const html = await res.text();

    // Parse clip_left class elements for related keywords
    const related: string[] = [];
    const regex = /class="[^"]*clip_left[^"]*"[^>]*>([^<]+)</g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const kw = match[1].trim().replace(/\s+/g, "");
      if (kw) related.push(kw);
    }

    // Also try other common patterns for related searches
    const regex2 = /data-area="[^"]*"[^>]*>([^<]{2,30})</g;
    while ((match = regex2.exec(html)) !== null) {
      const kw = match[1].trim().replace(/\s+/g, "");
      if (kw && !kw.includes("<") && !kw.includes("{")) related.push(kw);
    }

    return related;
  } catch {
    return [];
  }
}

async function getPcRelated(query: string): Promise<string[]> {
  try {
    const url = `https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) return [];
    const html = await res.text();

    const related: string[] = [];
    // Parse related search keywords from PC SERP
    const regex = /class="[^"]*keyword[^"]*"[^>]*>([^<]+)</g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const kw = match[1].trim().replace(/\s+/g, "");
      if (kw && kw.length > 1 && kw.length < 30) related.push(kw);
    }

    return related;
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const seedKeywords: string[] = body.seedKeywords || [];
    const limit = Math.min(seedKeywords.length, 100); // Top 100 only

    const topSeeds = seedKeywords.slice(0, limit);
    const allRelated: string[] = [];

    for (const seed of topSeeds) {
      // Mobile related
      const mobileRelated = await getMobileRelated(seed);
      allRelated.push(...mobileRelated);
      await sleep(500);

      // PC related
      const pcRelated = await getPcRelated(seed);
      allRelated.push(...pcRelated);
      await sleep(500);
    }

    const unique = Array.from(new Set(allRelated));

    return NextResponse.json({
      step: 5,
      name: "연관검색어 수집",
      count: unique.length,
      inputSeeds: topSeeds.length,
      keywords: unique.map((kw) => ({
        keyword: kw,
        monthlyPcQcCnt: 0,
        monthlyMobileQcCnt: 0,
        totalSearchCount: 0,
        compIdx: "-",
        source: "step5-연관검색어",
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
