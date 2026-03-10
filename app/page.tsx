"use client";

import { useState, useCallback } from "react";
import PipelineControl from "@/components/PipelineControl";
import KeywordTable from "@/components/KeywordTable";
import StatsCards from "@/components/StatsCards";
import { Keyword } from "@/lib/utils";

interface StepStatus {
  step: number;
  name: string;
  status: "idle" | "running" | "done" | "error";
  count: number;
  message?: string;
}

const INITIAL_STEPS: StepStatus[] = [
  { step: 1, name: "쇼핑인사이트 키워드 수집", status: "idle", count: 0 },
  { step: 2, name: "Gemini AI 시드 키워드 생성", status: "idle", count: 0 },
  { step: 3, name: "검색광고 API 키워드 확장", status: "idle", count: 0 },
  { step: 4, name: "자동완성 키워드 (롱테일)", status: "idle", count: 0 },
  { step: 5, name: "연관검색어 수집", status: "idle", count: 0 },
  { step: 6, name: "최종 합산 & 중복제거", status: "idle", count: 0 },
];

export default function Home() {
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(INITIAL_STEPS);
  const [allKeywords, setAllKeywords] = useState<Keyword[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sheetsStatus, setSheetsStatus] = useState<
    "idle" | "saving" | "loading" | "saved" | "loaded" | "error"
  >("idle");
  const [sheetsMessage, setSheetsMessage] = useState("");

  const updateStep = useCallback(
    (step: number, update: Partial<StepStatus>) => {
      setStepStatuses((prev) =>
        prev.map((s) => (s.step === step ? { ...s, ...update } : s))
      );
    },
    []
  );

  const runStep = useCallback(
    async (
      step: number,
      seedKeywords?: string[],
      existingKeywords?: Keyword[]
    ): Promise<Keyword[]> => {
      updateStep(step, { status: "running", message: "요청 중..." });

      try {
        let body: Record<string, unknown> = {};
        if (step === 3 || step === 4 || step === 5) {
          body = { seedKeywords: seedKeywords || [] };
        }
        if (step === 6) {
          body = { keywords: existingKeywords || [] };
        }

        const res = await fetch(`/api/pipeline/step${step}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Step ${step} failed`);
        }

        const kws: Keyword[] = data.keywords || [];
        updateStep(step, {
          status: "done",
          count: kws.length,
          message: `${kws.length}개 키워드 수집 완료`,
        });
        return kws;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        updateStep(step, { status: "error", message });
        return [];
      }
    },
    [updateStep]
  );

  const runSingleStep = useCallback(
    async (step: number) => {
      setIsRunning(true);
      try {
        // For steps that need seeds, use existing keywords
        const existingSeeds = allKeywords.map((kw) => kw.keyword);
        const result = await runStep(step, existingSeeds, allKeywords);
        if (result.length > 0) {
          if (step === 6) {
            setAllKeywords(result);
          } else {
            setAllKeywords((prev) => [...prev, ...result]);
          }
        }
      } finally {
        setIsRunning(false);
      }
    },
    [allKeywords, runStep]
  );

  const runFullPipeline = useCallback(async () => {
    setIsRunning(true);
    setAllKeywords([]);
    setStepStatuses(INITIAL_STEPS);

    try {
      // Step 1: Shopping Insight
      const step1 = await runStep(1);
      let accumulated = [...step1];

      // Step 2: Gemini Seeds
      const step2 = await runStep(2);
      accumulated = [...accumulated, ...step2];

      // Step 3: Keyword Expansion (use accumulated seeds)
      const seeds = accumulated.map((kw) => kw.keyword);
      const step3 = await runStep(3, seeds);
      accumulated = [...accumulated, ...step3];

      // Step 4: Autocomplete (top seeds by search volume)
      const sortedSeeds = [...accumulated]
        .sort((a, b) => b.totalSearchCount - a.totalSearchCount)
        .map((kw) => kw.keyword);
      const step4 = await runStep(4, sortedSeeds);
      accumulated = [...accumulated, ...step4];

      // Step 5: Related Keywords
      const topSeeds = sortedSeeds.slice(0, 100);
      const step5 = await runStep(5, topSeeds);
      accumulated = [...accumulated, ...step5];

      // Step 6: Final merge & dedup
      const final = await runStep(6, undefined, accumulated);
      setAllKeywords(final);
    } finally {
      setIsRunning(false);
    }
  }, [runStep]);

  const handleSaveToSheets = useCallback(async () => {
    setSheetsStatus("saving");
    setSheetsMessage("");
    try {
      const res = await fetch("/api/sheets/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: allKeywords }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장 실패");
      setSheetsStatus("saved");
      setSheetsMessage(`${data.savedCount}개 키워드 저장 완료`);
    } catch (err) {
      setSheetsStatus("error");
      setSheetsMessage(err instanceof Error ? err.message : "저장 실패");
    }
  }, [allKeywords]);

  const handleLoadFromSheets = useCallback(async () => {
    setSheetsStatus("loading");
    setSheetsMessage("");
    try {
      const res = await fetch("/api/sheets/load");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "불러오기 실패");
      setAllKeywords(data.keywords);
      setSheetsStatus("loaded");
      setSheetsMessage(`${data.keywords.length}개 키워드 불러옴`);
    } catch (err) {
      setSheetsStatus("error");
      setSheetsMessage(err instanceof Error ? err.message : "불러오기 실패");
    }
  }, []);

  const handleExportCsv = useCallback(async () => {
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: allKeywords }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `uvid-keywords-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
    }
  }, [allKeywords]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                UVID 선케어 키워드 디스커버리
              </h1>
              <p className="text-blue-200 text-sm mt-1">
                유비드(UVID) 선케어 브랜드 키워드 발굴 자동화 툴
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadFromSheets}
                disabled={sheetsStatus === "loading" || sheetsStatus === "saving"}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {sheetsStatus === "loading" ? "불러오는 중..." : "Sheets에서 불러오기"}
              </button>
              {allKeywords.length > 0 && (
                <>
                  <button
                    onClick={handleSaveToSheets}
                    disabled={sheetsStatus === "saving" || sheetsStatus === "loading"}
                    className="px-4 py-2 bg-green-500/80 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                  >
                    {sheetsStatus === "saving" ? "저장 중..." : "Sheets에 저장"}
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    CSV 다운로드
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sheets Status */}
      {sheetsMessage && (
        <div
          className={`max-w-7xl mx-auto px-4 pt-4 ${
            sheetsStatus === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              sheetsStatus === "error"
                ? "bg-red-50 border border-red-200"
                : "bg-green-50 border border-green-200"
            }`}
          >
            {sheetsMessage}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <StatsCards keywords={allKeywords} stepStatuses={stepStatuses} />
        <PipelineControl
          stepStatuses={stepStatuses}
          isRunning={isRunning}
          onRunAll={runFullPipeline}
          onRunStep={runSingleStep}
        />
        <KeywordTable keywords={allKeywords} />
      </main>
    </div>
  );
}
