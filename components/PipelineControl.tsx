"use client";

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

export default function PipelineControl({
  stepStatuses,
  isRunning,
  onRunAll,
  onRunStep,
}: PipelineControlProps) {
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
          <div
            key={step.step}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold text-gray-400 w-8">
                S{step.step}
              </span>
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
                onClick={() => onRunStep(step.step)}
                disabled={isRunning}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                실행
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
