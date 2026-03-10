const AXES = [
  { name: "증상/효과", prompt: "자외선차단, SPF50+, UV차단, 피부보호 등 선케어의 증상/효과와 관련된 네이버 검색 키워드" },
  { name: "원인/상황", prompt: "야외활동, 운동할때, 출근전, 등산, 골프, 바다, 캠핑 등 선크림이 필요한 상황 관련 검색 키워드" },
  { name: "해결법", prompt: "자외선차단방법, 선크림바르는법, 선크림덧바르기, 자외선차단루틴 등 해결법 관련 검색 키워드" },
  { name: "제품/성분", prompt: "징크선크림, 나이아신아마이드선크림, 세라마이드선크림, 히알루론산선크림 등 성분/제품 관련 검색 키워드" },
  { name: "피부타입", prompt: "지성선크림, 민감성선크림, 건성선크림, 복합성선크림, 트러블피부선크림 등 피부타입별 검색 키워드" },
  { name: "타깃인물", prompt: "남자선크림, 아기선크림, 임산부선크림, 어린이선크림, 중년선크림 등 타깃 인물 관련 검색 키워드" },
  { name: "시간/계절", prompt: "여름선크림, 겨울선크림, 봄선크림, 사계절선크림, 환절기선크림 등 시간/계절 관련 검색 키워드" },
  { name: "비교/vs", prompt: "선크림vs선세럼, 선패드vs선크림, 무기자차vs유기자차, 선스틱vs선크림 등 비교 관련 검색 키워드" },
  { name: "후기/경험", prompt: "선크림추천, 선패드후기, 선크림리뷰, 선크림사용후기, 선크림순위 등 후기/경험 관련 검색 키워드" },
  { name: "부작용/걱정", prompt: "선크림발림성, 백탁현상, 선크림트러블, 선크림모공막힘, 선크림끈적임 등 부작용/걱정 관련 검색 키워드" },
  { name: "가격/구매", prompt: "선크림가성비, 선크림랭킹, 선크림1등, 선크림가격, 저렴한선크림 등 가격/구매 관련 검색 키워드" },
  { name: "대체/루틴", prompt: "선케어루틴, 스킨케어순서, 선크림대용, 자외선차단식품 등 대체/루틴 관련 검색 키워드" },
];

export { AXES };

export async function generateSeedKeywords(
  axisIndex: number
): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const axis = AXES[axisIndex];
  if (!axis) throw new Error(`Invalid axis index: ${axisIndex}`);

  const prompt = `당신은 한국 네이버 검색 키워드 전문가입니다.
선케어(선크림, 선패드, 선세럼, 선스틱, 선쿠션, 선스프레이) 카테고리에서
"${axis.name}" 축에 해당하는 키워드를 생성해주세요.

요구사항:
- ${axis.prompt}
- 한국 소비자가 실제로 네이버에서 검색할 법한 키워드
- 공백 없이 붙여쓰기 (예: "선크림추천", "자외선차단제")
- 10~15개 생성
- JSON 배열 형식으로만 응답 (다른 텍스트 없이)
- 예시: ["선크림추천","자외선차단제","SPF50선크림"]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "[]";

  const match = text.match(/\[[\s\S]*?\]/);
  if (!match) return [];

  try {
    const keywords: string[] = JSON.parse(match[0]);
    return keywords.map((kw: string) => kw.replace(/\s+/g, ""));
  } catch {
    return [];
  }
}

// 모든 축을 병렬로 처리
export async function generateAllSeedKeywords(): Promise<string[]> {
  const results = await Promise.allSettled(
    AXES.map((_, i) => generateSeedKeywords(i))
  );
  
  const allKeywords: string[] = [];
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      allKeywords.push(...result.value);
    }
  });
  
  return allKeywords;
}
