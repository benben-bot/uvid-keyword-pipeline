# TASK: UVID 선케어 키워드 디스커버리 웹앱

## 프로젝트 개요
- **목적**: 유비드(UVID) 선케어 브랜드를 위한 키워드 발굴 자동화 툴
- **참조 사이트**: https://keyword-pipeline.vercel.app/ (파이프라인 문서 참고)
- **배포**: Vercel (기존 대시보드와 별개 프로젝트)
- **스택**: Next.js 14 App Router + TypeScript + Tailwind CSS

---

## 핵심 요구사항

### 브랜드/카테고리 고정값
- 브랜드: UVID (유비드)
- 카테고리: 선케어 전체 (선크림, 선패드, 선세럼, 선스틱, 선쿠션, 선스프레이 등)
- 네이버 쇼핑 카테고리 코드: 뷰티 > 선케어 관련 (구현 시 실제 코드 확인 필요)

### API 자격증명 (환경변수로 관리)
```
NAVER_ADS_CUSTOMER_ID=1748252
NAVER_ADS_API_KEY=01000000003dc8d89f2198f105f99520ecf3412b0f0d90bc89f6829ffa13f78f8f9246c3a4
NAVER_ADS_SECRET_KEY=AQAAAAA9yNifIZjxBfmVIOzzQSsPX2tVsb7x2dm4X407+Di2Yw==
GEMINI_API_KEY=AIzaSyDi5lJESX0IfpWdPCfZ3Qcc8x2gTywbMaI
```

---

## 파이프라인 구현 (6단계)

### Step 1: 쇼핑인사이트 키워드 수집
- API: 네이버 데이터랩 쇼핑인사이트
- 선케어 카테고리 인기 키워드 수집 (하위 카테고리 세분화)
- 수집 후 검색량 100 미만 자동 필터링

### Step 2: Gemini AI 시드 키워드 생성
- 12개 축으로 분리 호출, 각 축당 10~15개 생성 → 총 80~120개 시드
- 12개 축:
  1. 증상/효과 대표 (자외선차단, SPF50+)
  2. 원인/상황 (야외활동, 운동할때)
  3. 해결법 (자외선차단방법)
  4. 제품/성분 (징크선크림, 나이아신아마이드)
  5. 피부타입 (지성선크림, 민감성선크림)
  6. 타깃 인물 (남자선크림, 아기선크림, 임산부선크림)
  7. 시간/계절 (여름선크림, 겨울선크림)
  8. 비교/vs (선크림vs선세럼)
  9. 후기/경험 (선크림추천, 선패드후기)
  10. 부작용/걱정 (선크림발림성, 백탁현상)
  11. 가격/구매 (선크림가성비, 선크림랭킹)
  12. 대체/자연요법 (선케어루틴)
- 생성 후 검색량 100 미만 필터링

### Step 3: 검색광고 API 키워드 확장
- API: 네이버 검색광고 /keywordstool
- 시드 키워드 → 수천개로 확장
- 월간 PC/모바일 검색수, 경쟁도 수집
- 배치: 5개씩 분할 호출
- ⚠️ 주의: 공백 없이 붙여쓰기 필수 (400 에러 방지)
- 검색량 100 미만 자동 삭제

### Step 4: 자동완성 키워드 (롱테일)
- API: https://ac.search.naver.com/nx/ac
- 파라미터: q=키워드, frm=mobile_nv, r_format=json
- 응답 JSON items[0] 파싱
- 딜레이: 건당 0.2초 sleep
- 검색량 상위 시드에만 적용

### Step 5: 연관검색어 수집 (3소스)
- 모바일 연관: https://m.search.naver.com/search.naver?where=m&query={키워드}
  - class="clip_left" 태그 파싱
  - iPhone User-Agent 사용
  - 딜레이: 0.5초
  - 검색량 상위 100개 시드만
- PC 연관: https://search.naver.com/search.naver?where=nexearch&query={키워드}
- 검색광고 연관: Step 3 결과 활용

### Step 6: 최종 합산 & 중복제거
- 전체 소스 합산 → 중복제거 → 검색량 재조회
- 배치: 500개씩 API 호출
- 검색량 100 미만 최종 삭제
- CSV 다운로드 지원

---

## UI/UX 요구사항

### 메인 페이지 레이아웃
1. **헤더**: UVID 선케어 키워드 디스커버리 (브랜딩)
2. **실행 패널**:
   - [전체 파이프라인 실행] 버튼
   - 각 Step별 개별 실행 버튼
   - 실행 상태 표시 (진행 중 / 완료 / 에러)
3. **결과 테이블**:
   - 키워드 / 월간검색(PC) / 월간검색(모바일) / 총검색량 / 경쟁도 / 소스
   - 정렬 가능 (검색량 내림차순 기본)
   - 필터: 검색량 범위, 경쟁도, 소스별
4. **통계 카드**: 총 키워드 수, 평균 검색량, Step별 수집 현황
5. **내보내기**: CSV 다운로드 버튼

### 실시간 진행 표시
- 각 Step 실행 시 진행 상황 실시간 표시 (SSE 또는 polling)
- "Step 2/6 진행 중 (42개 키워드 생성됨...)" 형태

---

## 기술 아키텍처

### 디렉토리 구조
```
uvid-keyword-discovery/
├── app/
│   ├── page.tsx              # 메인 UI
│   ├── layout.tsx
│   └── api/
│       ├── pipeline/
│       │   ├── step1/route.ts   # 쇼핑인사이트
│       │   ├── step2/route.ts   # Gemini AI
│       │   ├── step3/route.ts   # 검색광고 확장
│       │   ├── step4/route.ts   # 자동완성
│       │   ├── step5/route.ts   # 연관검색어
│       │   └── step6/route.ts   # 최종 합산
│       └── export/route.ts      # CSV 내보내기
├── lib/
│   ├── naver-ads.ts          # 네이버 검색광고 API 클라이언트
│   ├── naver-datalab.ts      # 네이버 데이터랩 API 클라이언트
│   ├── gemini.ts             # Gemini API 클라이언트
│   └── utils.ts              # 공통 유틸리티
├── components/
│   ├── KeywordTable.tsx
│   ├── PipelineControl.tsx
│   └── StatsCards.tsx
├── .env.local                # API 키 (git 제외)
├── .env.example              # 예시 파일
└── vercel.json               # 타임아웃 설정 (60s)
```

### 네이버 검색광고 API 인증
```typescript
// HMAC-SHA256 서명 방식
const timestamp = Date.now().toString();
const signature = hmac_sha256(SECRET_KEY, `${timestamp}.GET./keywordstool`);
headers: {
  'X-Timestamp': timestamp,
  'X-API-KEY': API_KEY,
  'X-Customer': CUSTOMER_ID,
  'X-Signature': signature
}
```

### Vercel 설정
- `vercel.json`에 maxDuration: 60 설정 (파이프라인 타임아웃 방지)
- 환경변수는 Vercel Dashboard에서 설정 (벤이 직접)

---

## 완료 기준 (Definition of Done)
- [ ] 모든 6단계 API 연동 완료
- [ ] 전체 파이프라인 실행 시 키워드 결과 표시
- [ ] CSV 다운로드 동작
- [ ] Vercel 배포 가능한 상태 (build 성공)
- [ ] .env.example 파일 포함 (실제 키 제외)
- [ ] README.md 작성 (실행 방법, 환경변수 설명)

---

## 제약사항
- `.env.local`은 절대 git commit하지 않음
- API 키는 서버사이드에서만 사용 (클라이언트 노출 금지)
- 네이버 크롤링 딜레이 준수 (차단 방지)
- Vercel free tier 기준 (serverless function 실행시간 제한 고려)

---

## 참고 자료
- 원본 파이프라인 문서: https://keyword-pipeline.vercel.app/
- 네이버 검색광고 API 문서: https://naver.github.io/searchad-apidoc/
- Gemini API: https://ai.google.dev/

---

**작성일**: 2026-03-10  
**담당**: BENVIS  
**브랜드**: UVID (유비드) 선케어
