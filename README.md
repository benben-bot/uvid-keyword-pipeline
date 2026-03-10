# UVID 선케어 키워드 디스커버리

유비드(UVID) 선케어 브랜드를 위한 키워드 발굴 자동화 웹앱

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Vercel 배포

## 시작하기

### 1. 환경변수 설정

`.env.example`을 `.env.local`로 복사하고 실제 API 키를 입력:

```bash
cp .env.example .env.local
```

필요한 환경변수:
- `NAVER_ADS_CUSTOMER_ID` - 네이버 검색광고 고객 ID
- `NAVER_ADS_API_KEY` - 네이버 검색광고 API 키
- `NAVER_ADS_SECRET_KEY` - 네이버 검색광고 Secret 키
- `GEMINI_API_KEY` - Google Gemini API 키

### 2. 설치 및 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인

### 3. 빌드

```bash
npm run build
npm start
```

## 파이프라인 (6단계)

| Step | 이름 | 설명 |
|------|------|------|
| 1 | 쇼핑인사이트 | 선케어 카테고리 인기 키워드 수집 |
| 2 | Gemini AI | 12개 축으로 시드 키워드 생성 |
| 3 | 검색광고 확장 | 네이버 검색광고 API로 키워드 확장 |
| 4 | 자동완성 | 네이버 자동완성 롱테일 키워드 |
| 5 | 연관검색어 | 모바일/PC 연관검색어 수집 |
| 6 | 최종 합산 | 중복제거, 검색량 재조회, 필터링 |

## 배포

Vercel에 배포 후 Dashboard에서 환경변수 설정 필요.
