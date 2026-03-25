"use client";

import { useState, useEffect } from "react";

const DEFAULT_SEEDS = [
  "선크림",
  "썬크림",
  "자외선차단제",
  "선크림추천",
  "선패드",
  "선패드추천",
  "선패드순위",
  "선세럼",
  "선세럼추천",
  "선스틱",
  "선스틱추천",
  "선쿠션",
  "선쿠션추천",
  "선스프레이",
  "선스프레이추천",
  "선케어",
];

const STORAGE_KEY = "uvid_s1_seeds";

interface SeedEditorProps {
  onSeedsChange: (seeds: string[]) => void;
}

export const loadSeeds = (): string[] => {
  if (typeof window === "undefined") return DEFAULT_SEEDS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SEEDS;
};

export default function SeedEditor({ onSeedsChange }: SeedEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [seeds, setSeeds] = useState<string[]>(DEFAULT_SEEDS);
  const [editText, setEditText] = useState("");
  const [saved, setSaved] = useState(false);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    const loaded = loadSeeds();
    setSeeds(loaded);
    onSeedsChange(loaded);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setIsCustom(
          JSON.stringify(parsed) !== JSON.stringify(DEFAULT_SEEDS)
        );
      } catch {
        // ignore
      }
    }
  }, [onSeedsChange]);

  const handleOpen = () => {
    setEditText(seeds.join("\n"));
    setIsOpen(true);
    setSaved(false);
  };

  const handleSave = () => {
    const newSeeds = editText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (newSeeds.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSeeds));
    setSeeds(newSeeds);
    onSeedsChange(newSeeds);
    setIsCustom(JSON.stringify(newSeeds) !== JSON.stringify(DEFAULT_SEEDS));
    setSaved(true);
    setIsOpen(false);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSeeds(DEFAULT_SEEDS);
    onSeedsChange(DEFAULT_SEEDS);
    setEditText(DEFAULT_SEEDS.join("\n"));
    setIsCustom(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mb-2">
      {/* S1 시드 현황 배지 + 편집 버튼 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
        <span className="text-blue-600 font-medium">S1 시드:</span>
        <span className="text-gray-600">{seeds.length}개 키워드</span>
        {isCustom && (
          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs">
            수정됨
          </span>
        )}
        <button
          onClick={handleOpen}
          className="ml-auto px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
        >
          ✏️ 편집
        </button>
        {isCustom && (
          <button
            onClick={handleReset}
            className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors text-xs"
          >
            기본값으로 초기화
          </button>
        )}
        {saved && !isOpen && (
          <span className="text-green-600">저장됨 ✓</span>
        )}
      </div>

      {/* 편집 패널 */}
      {isOpen && (
        <div className="mt-2 p-4 bg-white border border-blue-300 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">
              S1 시드 키워드 편집 <span className="text-gray-400 font-normal">(줄바꿈으로 구분)</span>
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕ 닫기
            </button>
          </div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-48 text-xs border border-gray-200 rounded p-2 font-mono resize-none focus:outline-none focus:border-blue-400"
            placeholder="키워드를 줄바꿈으로 입력..."
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-medium"
            >
              저장
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
            >
              기본값으로 초기화
            </button>
            <span className="text-xs text-gray-400">
              현재 {editText.split("\n").filter((s) => s.trim()).length}개
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
