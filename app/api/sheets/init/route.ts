import { NextResponse } from "next/server";
import { initSheet } from "@/lib/sheets";

export const maxDuration = 60;

export async function GET() {
  try {
    const result = await initSheet();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sheets init error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
