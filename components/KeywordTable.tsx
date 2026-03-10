"use client";

import { useState, useMemo } from "react";
import { Keyword } from "@/lib/utils";

interface KeywordTableProps {
  keywords: Keyword[];
}

type SortKey = "keyword" | "monthlyPcQcCnt" | "monthlyMobileQcCnt" | "totalSearchCount" | "compIdx" | "source";

export default function KeywordTable({ keywords }: KeywordTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalSearchCount");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [minVolume, setMinVolume] = useState(100);
  const [maxVolume, setMaxVolume] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const sources = useMemo(() => {
    const s = new Set(keywords.map((kw) => kw.source));
    return ["all", ...Array.from(s)];
  }, [keywords]);

  const filtered = useMemo(() => {
    let result = keywords;

    if (filterSource !== "all") {
      result = result.filter((kw) => kw.source === filterSource);
    }
    if (minVolume > 0) {
      result = result.filter((kw) => kw.totalSearchCount >= minVolume);
    }
    if (maxVolume > 0) {
      result = result.filter((kw) => kw.totalSearchCount <= maxVolume);
    }
    if (searchQuery) {
      result = result.filter((kw) =>
        kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av;
      }
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return result;
  }, [keywords, filterSource, minVolume, maxVolume, searchQuery, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return "↕";
    return sortAsc ? "↑" : "↓";
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="키워드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 border rounded text-sm w-48"
        />
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-3 py-1.5 border rounded text-sm"
        >
          {sources.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "모든 소스" : s}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">검색량:</span>
          <input
            type="number"
            value={minVolume}
            onChange={(e) => setMinVolume(Number(e.target.value))}
            className="px-2 py-1.5 border rounded w-20 text-sm"
            placeholder="최소"
          />
          <span className="text-gray-400">~</span>
          <input
            type="number"
            value={maxVolume || ""}
            onChange={(e) => setMaxVolume(Number(e.target.value))}
            className="px-2 py-1.5 border rounded w-20 text-sm"
            placeholder="최대"
          />
        </div>
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length.toLocaleString()}개 표시
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
              {(
                [
                  ["keyword", "키워드"],
                  ["monthlyPcQcCnt", "월간검색(PC)"],
                  ["monthlyMobileQcCnt", "월간검색(모바일)"],
                  ["totalSearchCount", "총검색량"],
                  ["compIdx", "경쟁도"],
                  ["source", "소스"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                >
                  {label} {sortIcon(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.slice(0, 500).map((kw, i) => (
              <tr key={`${kw.keyword}-${i}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium">{kw.keyword}</td>
                <td className="px-4 py-2 text-right">
                  {kw.monthlyPcQcCnt.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">
                  {kw.monthlyMobileQcCnt.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right font-semibold">
                  {kw.totalSearchCount.toLocaleString()}
                </td>
                <td className="px-4 py-2">{kw.compIdx}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{kw.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            키워드 데이터가 없습니다. 파이프라인을 실행해주세요.
          </div>
        )}
        {filtered.length > 500 && (
          <div className="text-center py-3 text-xs text-gray-400">
            상위 500개만 표시됩니다. 전체 데이터는 CSV로 다운로드하세요.
          </div>
        )}
      </div>
    </div>
  );
}
