import { NextResponse } from "next/server";
import { loadKeywordsFromSheet } from "@/lib/sheets";

export const maxDuration = 60;

export async function GET() {
  try {
    const keywords = await loadKeywordsFromSheet();
    return NextResponse.json({ keywords });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sheets load error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
