-- keyword_settings 테이블 생성
-- uvid-keyword-pipeline 프로젝트용
-- 블랙리스트 + S1 시드를 PC 무관하게 저장

CREATE TABLE IF NOT EXISTS keyword_settings (
  id BIGSERIAL PRIMARY KEY,
  brand_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('blacklist', 'seeds')),
  keywords TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, type)
);

CREATE INDEX IF NOT EXISTS idx_keyword_settings_brand_type ON keyword_settings(brand_id, type);
