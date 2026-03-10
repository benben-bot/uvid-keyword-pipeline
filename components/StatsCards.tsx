"use client";

import { Keyword } from "@/lib/utils";

interface StepStatus {
  step: number;
  name: string;
  status: "idle" | "running" | "done" | "error";
  count: number;
  message?: string;
}

interface StatsCardsProps {
  keywords: Keyword[];
  stepStatuses: StepStatus[];
}

export default function StatsCards({ keywords, stepStatuses }: StatsCardsProps) {
  const totalKeywords = keywords.length;
  const avgSearchVolume =
    totalKeywords > 0
      ? Math.round(
          keywords.reduce((sum, kw) => sum + kw.totalSearchCount, 0) /
            totalKeywords
        )
      : 0;

  const stepCounts = stepStatuses.reduce(
    (acc, s) => {
      acc[s.step] = s.count;
      return acc;
    },
    {} as Record<number, number>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">총 키워드</p>
        <p className="text-2xl font-bold text-blue-600">
          {totalKeywords.toLocaleString()}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">평균 검색량</p>
        <p className="text-2xl font-bold text-green-600">
          {avgSearchVolume.toLocaleString()}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">완료 단계</p>
        <p className="text-2xl font-bold text-purple-600">
          {stepStatuses.filter((s) => s.status === "done").length}/6
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Step별 수집</p>
        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
          {stepStatuses.map((s) => (
            <div key={s.step} className="flex justify-between">
              <span>S{s.step}</span>
              <span className="font-medium">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
