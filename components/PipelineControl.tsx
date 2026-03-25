"use client";

import { useState } from "react";

interface StepStatus {
  step: number;
  name: string;
  status: "idle" | "running" | "done" | "error";
  count: number;
  message?: string;
}

interface PipelineControlProps {
  stepStatuses: StepStatus[];
  isRunning: boolean;
  onRunAll: () => void;
  onRunStep: (step: number) => void;
}

const statusColors = {
  idle: "bg-gray-100 text-gray-600",
  running: "bg-yellow-100 text-yellow-700 animate-pulse",
  done: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

const statusLabels = {
  idle: "대기",
  running: "진행 중",
  done: "완료",
  error: "에러",
};

const STEP_INFO: Record<number, { title: string; content: React.ReactNode }> = {
  1: {
    title: "S1 시드 키워드 (16개 하드코딩)",
    content: (
      <div className="text-xs text-gray-600 space-y-1">
        <p className="font-medium text-gray-700 mb-1">선케어 카테고리별 뿌리 키워드:</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span>• 선크림, 썬크림, 자외선차단제, 선크림추천</span>
          <span>• 선패드, 선패드추천, 선패드순위</span>
          <span>• 선세럼, 선세럼추천</span>
          <span>• 선스틱, 선스틱추천</span>
          <span>• 선쿠션, 선쿠션추천</span>
          <span>• 선스프레이, 선스프레이추천</span>
        </div>
        <p className="text-gray-500 mt-1">→ 네이버 검색광고 API로 검색량 조회 후 상위 키워드 추출</p>
      </div>
    ),
  },
  2: {
    title: "S2 Gemini AI — 12개 축 자동 확장",
    content: (
      <div className="text-xs text-gray-600 space-y-1">
        <p className="font-medium text-gray-700 mb-1">선케어 범위 한정 프롬프트로 각 축별 10~15개 생성:</p>
        <div className="grid grid-cols-3 gap-x-4 gap-y-0.5">
          <span>• 증상/효과</span>
          <span>• 원인/상황</span>
          <span>• 해결법</span>
          <span>• 제품/성분</span>
          <span>• 피부타입</span>
          <span>• 타깃인물</span>
          <span>• 시간/계절</span>
          <span>• 비교/vs</span>
          <span>• 후기/경험</span>
          <span>• 부작용/걱정</span>
          <span>• 가격/구매</span>
          <span>• 대체/루틴</span>
        </div>
        <p className="text-gray-500 mt-1">→ 최대 ~180개 시드 생성 → 검색량 조회 후 상위 추출</p>
      </div>
    ),
  },
  3: {
    title: "S3 검색광고 API 키워드 확장",
    content: (
      <div className="text-xs text-gray-600 space-y-1">
        <p>• <strong>시드</strong>: S1+S2 결과 상위 50개 키워드</p>
        <p>• 네이버 검색광고 API <code className="bg-gray-100 px-1 rounded">getKeywordStats</code> 호출</p>
        <p>• 반환된 연관 키워드 중 <strong>선케어 필터</strong> 통과한 것만 포함</p>
        <p className="text-gray-500">→ S1+S2+S3 합산 상위 50개가 S4 시드로 전달</p>
      </div>
    ),
  },
  4: {
    title: "S4 자동완성 키워드 (롱테일)",
    content: (
      <div className="text-xs text-gray-600 space-y-1">
        <p>• <strong>시드</strong>: S1+S2+S3 합산 상위 50개</p>
        <p>• 네이버 자동완성 API로 롱테일 키워드 수집</p>
        <p>• <strong>선케어 필터</strong> 통과한 것만 포함</p>
        <p className="text-gray-500">→ 상위 20개 추출 후 S5 시드로 전달</p>
      </div>
    ),
  },
  5: {
    title: "S5 연관검색어 수집",
    content: (
      <div className="text-xs text-gray-600 space-y-1">
        <p>• <strong>시드</strong>: 누적 결과 상위 100개 키워드</p>
        <p>• 네이버 연관검색어 API 호출</p>
        <p>• <strong>선케어 필터</strong> 통과한 것만 포함</p>
        <p className="text-gray-500">→ S1~S5 전체 합산이 S6으로 전달</p>
      </div>
    ),
  },
  6: {
    title: "S6 최종 합산 & 중복제거",
    content: (
      <div className="text-xs text-gray-600 space-y-1">
        <p>• S1~S5 전체 키워드 합산</p>
        <p>• 중복 키워드 제거 (keyword 기준)</p>
        <p>• <strong>선케어 필터</strong> 최종 적용 (이중 차단)</p>
        <p>• 총검색량 기준 내림차순 정렬</p>
        <p className="text-gray-500">→ 최종 결과 테이블에 표시</p>
      </div>
    ),
  },
};

export default function PipelineControl({
  stepStatuses,
  isRunning,
  onRunAll,
  onRunStep,
}: PipelineControlProps) {
  const [openStep, setOpenStep] = useState<number | null>(null);

  const toggleInfo = (step: number) => {
    setOpenStep((prev) => (prev === step ? null : step));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">파이프라인 실행</h2>
        <button
          onClick={onRunAll}
          disabled={isRunning}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? "실행 중..." : "전체 파이프라인 실행"}
        </button>
      </div>

      <div className="space-y-2">
        {stepStatuses.map((step) => (
          <div key={step.step} className="rounded-lg border border-gray-200 overflow-hidden">
            {/* Step Row */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleInfo(step.step)}
                  className="text-sm font-mono font-bold text-blue-500 hover:text-blue-700 w-8 text-left transition-colors"
                  title="클릭하면 단계 설명 보기"
                >
                  S{step.step}
                </button>
                <span className="text-sm font-medium">{step.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    statusColors[step.status]
                  }`}
                >
                  {statusLabels[step.status]}
                </span>
                {step.message && (
                  <span className="text-xs text-gray-500">{step.message}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {step.count > 0 && (
                  <span className="text-xs text-gray-500">
                    {step.count}개 키워드
                  </span>
                )}
                <button
                  onClick={() => toggleInfo(step.step)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    openStep === step.step
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                  title="단계 설명 보기"
                >
                  {openStep === step.step ? "▲" : "▼"}
                </button>
                <button
                  onClick={() => onRunStep(step.step)}
                  disabled={isRunning}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  실행
                </button>
              </div>
            </div>

            {/* Info Panel */}
            {openStep === step.step && STEP_INFO[step.step] && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  {STEP_INFO[step.step].title}
                </p>
                {STEP_INFO[step.step].content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
