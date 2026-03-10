import { NextResponse } from "next/server";
import { saveKeywordsToSheet } from "@/lib/sheets";
import { Keyword } from "@/lib/utils";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { keywords } = (await request.json()) as { keywords: Keyword[] };

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: "keywords 배열이 필요합니다" },
        { status: 400 }
      );
    }

    const result = await saveKeywordsToSheet(keywords);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sheets save error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
