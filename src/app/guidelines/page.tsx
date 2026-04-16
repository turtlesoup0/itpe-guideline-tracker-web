"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchGuidelines, fetchAgencies, type Guideline, type Agency } from "@/lib/api";

// ── 분야 라벨 + 색상 (법령 트래커 기준) ──

const CATEGORY_LABEL: Record<string, string> = {
  info_security: "정보보안",
  privacy: "개인정보",
  software: "소프트웨어",
  data: "데이터",
  cloud: "클라우드",
  ai: "인공지능",
  e_gov: "전자정부",
  finance: "금융보안",
  other: "기타",
};

const CATEGORY_BADGE_COLOR: Record<string, string> = {
  info_security: "bg-blue-100 text-blue-800 border-blue-200",
  privacy: "bg-rose-100 text-rose-800 border-rose-200",
  software: "bg-emerald-100 text-emerald-800 border-emerald-200",
  data: "bg-cyan-100 text-cyan-800 border-cyan-200",
  cloud: "bg-sky-100 text-sky-800 border-sky-200",
  ai: "bg-violet-100 text-violet-800 border-violet-200",
  e_gov: "bg-amber-100 text-amber-800 border-amber-200",
  finance: "bg-orange-100 text-orange-800 border-orange-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const CATEGORY_DOT_COLOR: Record<string, string> = {
  info_security: "bg-blue-500",
  privacy: "bg-rose-500",
  software: "bg-emerald-500",
  data: "bg-cyan-500",
  cloud: "bg-sky-500",
  ai: "bg-violet-500",
  e_gov: "bg-amber-500",
  finance: "bg-orange-500",
  other: "bg-gray-400",
};

type SortKey = "title" | "agency" | "date" | "category";
type SortDir = "asc" | "desc";

function formatYearMonth(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}년 ${m}월`;
}

export default function GuidelinesPage() {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [agencyFilter, setAgencyFilter] = useState<string>("");

  useEffect(() => {
    Promise.all([fetchGuidelines(), fetchAgencies()])
      .then(([gl, ag]) => {
        setGuidelines(gl);
        setAgencies(ag);
      })
      .catch((e) => setError(e.message));
  }, []);

  const agencyMap = useMemo(
    () => Object.fromEntries(agencies.map((a) => [a.id, a])),
    [agencies],
  );

  // 분야별·기관별 카운트 (필터 버튼에 표시)
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of guidelines) {
      map[g.category] = (map[g.category] || 0) + 1;
    }
    return map;
  }, [guidelines]);

  const agencyOptions = useMemo(() => {
    const map = new Map<number, { code: string; name: string; count: number }>();
    for (const g of guidelines) {
      const a = agencyMap[g.agency_id];
      if (!a) continue;
      const existing = map.get(a.id);
      if (existing) {
        existing.count++;
      } else {
        map.set(a.id, { code: a.code, name: a.short_name, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [guidelines, agencyMap]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = guidelines;

    if (q) {
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          (agencyMap[g.agency_id]?.short_name || "").toLowerCase().includes(q),
      );
    }

    if (categoryFilter) {
      list = list.filter((g) => g.category === categoryFilter);
    }

    if (agencyFilter) {
      list = list.filter((g) => {
        const a = agencyMap[g.agency_id];
        return a?.code === agencyFilter;
      });
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title, "ko");
          break;
        case "agency": {
          const aName = agencyMap[a.agency_id]?.short_name || "";
          const bName = agencyMap[b.agency_id]?.short_name || "";
          cmp = aName.localeCompare(bName, "ko");
          break;
        }
        case "date": {
          const aDate = a.latest_published_date || "";
          const bDate = b.latest_published_date || "";
          cmp = aDate.localeCompare(bDate);
          break;
        }
        case "category":
          cmp = (CATEGORY_LABEL[a.category] || a.category).localeCompare(
            CATEGORY_LABEL[b.category] || b.category,
            "ko",
          );
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [guidelines, agencies, agencyMap, search, sortKey, sortDir, categoryFilter, agencyFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">가이드라인</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          수집된 가이드라인 {guidelines.length}건
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-amber-600">
            백엔드 연결 실패: {error}
          </CardContent>
        </Card>
      )}

      {/* 검색바 */}
      {!error && guidelines.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="제목 또는 기관명으로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filtered.length}건{search || categoryFilter || agencyFilter ? ` / ${guidelines.length}건` : ""}
            </span>
          </div>

          {/* 분야 필터 토글 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">분야</span>
            {Object.entries(CATEGORY_LABEL)
              .filter(([key]) => categoryCounts[key])
              .sort(([, a], [, b]) => a.localeCompare(b, "ko"))
              .map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter((prev) => (prev === key ? "" : key))}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-all ${
                    categoryFilter === key
                      ? CATEGORY_BADGE_COLOR[key] + " ring-2 ring-offset-1 ring-current/20"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${CATEGORY_DOT_COLOR[key]}`} />
                  {label}
                  <span className="opacity-60">{categoryCounts[key]}</span>
                </button>
              ))}
          </div>

          {/* 기관 필터 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">기관</span>
            {agencyOptions.map((opt) => (
              <button
                key={opt.code}
                onClick={() => setAgencyFilter((prev) => (prev === opt.code ? "" : opt.code))}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-all ${
                  agencyFilter === opt.code
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                }`}
              >
                {opt.name}
                <span className="opacity-60">{opt.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!error && guidelines.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground space-y-2">
            <p className="text-lg font-medium">아직 등록된 가이드라인이 없습니다</p>
            <p>크롤링으로 수집된 항목이 가이드라인으로 등록되면 여기에 표시됩니다.</p>
          </CardContent>
        </Card>
      )}

      {/* ── 데스크톱: 테이블 ── */}
      {filtered.length > 0 && (
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("title")}
                >
                  제목{sortIndicator("title")}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50 w-[90px]"
                  onClick={() => handleSort("date")}
                >
                  게시일{sortIndicator("date")}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50 w-[90px]"
                  onClick={() => handleSort("agency")}
                >
                  기관{sortIndicator("agency")}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50 w-[90px]"
                  onClick={() => handleSort("category")}
                >
                  분야{sortIndicator("category")}
                </TableHead>
                <TableHead className="w-[60px]">링크</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((gl) => (
                <TableRow key={gl.id}>
                  <TableCell className="font-medium max-w-[420px]">
                    <div>{gl.title}</div>
                    {gl.version_count > 1 && (
                      <span className="text-xs text-muted-foreground">
                        {gl.version_count}개 버전
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums whitespace-nowrap">
                    {formatYearMonth(gl.latest_published_date)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {agencyMap[gl.agency_id]?.short_name || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={CATEGORY_BADGE_COLOR[gl.category] || ""}
                    >
                      {CATEGORY_LABEL[gl.category] || gl.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {gl.source_url && (
                      <a
                        href={gl.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        원문
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── 모바일: 카드 리스트 ── */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-2">
          {/* 모바일 정렬 컨트롤 */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>정렬:</span>
            {(["date", "title", "agency", "category"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`px-2 py-1 rounded ${
                  sortKey === key ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {{ date: "날짜", title: "제목", agency: "기관", category: "분야" }[key]}
                {sortKey === key && (sortDir === "asc" ? "↑" : "↓")}
              </button>
            ))}
          </div>

          {filtered.map((gl) => (
            <div key={gl.id} className="rounded-lg border p-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{gl.title}</p>
                </div>
                {gl.source_url && (
                  <a
                    href={gl.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs whitespace-nowrap shrink-0"
                  >
                    원문
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-[11px] px-1.5 py-0 ${CATEGORY_BADGE_COLOR[gl.category] || ""}`}
                >
                  {CATEGORY_LABEL[gl.category] || gl.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {agencyMap[gl.agency_id]?.short_name || "-"}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatYearMonth(gl.latest_published_date)}
                </span>
                {gl.version_count > 1 && (
                  <span className="text-xs text-muted-foreground">
                    {gl.version_count}개 버전
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {search && filtered.length === 0 && guidelines.length > 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>&ldquo;{search}&rdquo; 검색 결과가 없습니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
