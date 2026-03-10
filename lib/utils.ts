export interface Keyword {
  keyword: string;
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  totalSearchCount: number;
  compIdx: string;
  source: string;
}

export function deduplicateKeywords(keywords: Keyword[]): Keyword[] {
  const map = new Map<string, Keyword>();
  for (const kw of keywords) {
    const normalized = kw.keyword.replace(/\s+/g, "").toLowerCase();
    const existing = map.get(normalized);
    if (!existing || kw.totalSearchCount > existing.totalSearchCount) {
      map.set(normalized, { ...kw, keyword: kw.keyword.replace(/\s+/g, "") });
    }
  }
  return Array.from(map.values());
}

export function filterBySearchVolume(
  keywords: Keyword[],
  minVolume: number = 100
): Keyword[] {
  return keywords.filter((kw) => kw.totalSearchCount >= minVolume);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function keywordsToCsv(keywords: Keyword[]): string {
  const header = "키워드,월간검색(PC),월간검색(모바일),총검색량,경쟁도,소스";
  const rows = keywords.map(
    (kw) =>
      `"${kw.keyword}",${kw.monthlyPcQcCnt},${kw.monthlyMobileQcCnt},${kw.totalSearchCount},"${kw.compIdx}","${kw.source}"`
  );
  return [header, ...rows].join("\n");
}
