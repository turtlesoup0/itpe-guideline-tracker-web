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
  }, [guidelines, agencies, agencyMap, search, sortKey, sortDir]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">가이드라인</h1>
        <p className="mt-2 text-muted-foreground">
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
          <span className="text-sm text-muted-foreground">
            {filtered.length}건{search ? ` (전체 ${guidelines.length}건)` : ""}
          </span>
        </div>
      )}

      {!error && guidelines.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground space-y-2">
            <p className="text-lg font-medium">아직 등록된 가이드라인이 없습니다</p>
            <p>
              크롤링으로 수집된 항목이 가이드라인으로 등록되면 여기에 표시됩니다.
            </p>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="rounded-md border">
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
                    <Badge variant="outline">
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
