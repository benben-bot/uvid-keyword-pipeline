import { NextRequest, NextResponse } from "next/server";
import { keywordsToCsv, Keyword } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const keywords: Keyword[] = body.keywords || [];

    const csv = keywordsToCsv(keywords);
    const bom = "\uFEFF"; // BOM for Excel Korean support

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="uvid-keywords-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
