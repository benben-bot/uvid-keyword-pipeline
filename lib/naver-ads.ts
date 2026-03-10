import crypto from "crypto";
import { Keyword, chunkArray, sleep } from "./utils";

function getSignature(
  timestamp: string,
  method: string,
  path: string
): string {
  const secretKey = process.env.NAVER_ADS_SECRET_KEY!;
  const message = `${timestamp}.${method}.${path}`;
  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");
}

function getHeaders(method: string, path: string) {
  const timestamp = Date.now().toString();
  return {
    "Content-Type": "application/json",
    "X-Timestamp": timestamp,
    "X-API-KEY": process.env.NAVER_ADS_API_KEY!,
    "X-Customer": process.env.NAVER_ADS_CUSTOMER_ID!,
    "X-Signature": getSignature(timestamp, method, path),
  };
}

const ADS_API_BASE = "https://api.searchad.naver.com";

export async function getKeywordStats(
  keywords: string[]
): Promise<Keyword[]> {
  const path = "/keywordstool";
  const results: Keyword[] = [];
  const chunks = chunkArray(keywords, 5);

  for (const chunk of chunks) {
    const cleanKeywords = chunk.map((kw) => kw.replace(/\s+/g, ""));
    const query = cleanKeywords
      .map((kw) => `hintKeywords=${encodeURIComponent(kw)}`)
      .join("&");
    const url = `${ADS_API_BASE}${path}?${query}&showDetail=1`;

    const res = await fetch(url, {
      method: "GET",
      headers: getHeaders("GET", path),
    });

    if (!res.ok) {
      console.error(`Naver Ads API error: ${res.status} for chunk`, cleanKeywords);
      continue;
    }

    const data = await res.json();
    if (data.keywordList) {
      for (const item of data.keywordList) {
        const pc =
          typeof item.monthlyPcQcCnt === "number"
            ? item.monthlyPcQcCnt
            : parseInt(item.monthlyPcQcCnt) || 0;
        const mobile =
          typeof item.monthlyMobileQcCnt === "number"
            ? item.monthlyMobileQcCnt
            : parseInt(item.monthlyMobileQcCnt) || 0;
        results.push({
          keyword: item.relKeyword?.replace(/\s+/g, "") || "",
          monthlyPcQcCnt: pc,
          monthlyMobileQcCnt: mobile,
          totalSearchCount: pc + mobile,
          compIdx: item.compIdx || "낮음",
          source: "naver-ads",
        });
      }
    }

    await sleep(300);
  }

  return results;
}
