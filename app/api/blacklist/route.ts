import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const maxDuration = 30;

// GET /api/blacklist?brand_id=uvid
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brand_id");
  if (!brandId) {
    return NextResponse.json({ error: "brand_id 필요" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("keyword_settings")
    .select("keywords")
    .eq("brand_id", brandId)
    .eq("type", "blacklist")
    .single();
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ keywords: data?.keywords ?? [] });
}

// POST /api/blacklist  { brand_id, keywords: string[] }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { brand_id, keywords } = body;
  if (!brand_id || !Array.isArray(keywords)) {
    return NextResponse.json({ error: "brand_id, keywords 필요" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("keyword_settings")
    .upsert(
      { brand_id, type: "blacklist", keywords, updated_at: new Date().toISOString() },
      { onConflict: "brand_id,type" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/blacklist  { brand_id, keyword: string }
export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { brand_id, keyword } = body;
  if (!brand_id || !keyword) {
    return NextResponse.json({ error: "brand_id, keyword 필요" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  // 현재 목록 조회 후 해당 키워드 제거
  const { data } = await supabase
    .from("keyword_settings")
    .select("keywords")
    .eq("brand_id", brand_id)
    .eq("type", "blacklist")
    .single();
  const current: string[] = data?.keywords ?? [];
  const updated = current.filter((k) => k !== keyword);
  const { error } = await supabase
    .from("keyword_settings")
    .upsert(
      { brand_id, type: "blacklist", keywords: updated, updated_at: new Date().toISOString() },
      { onConflict: "brand_id,type" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
