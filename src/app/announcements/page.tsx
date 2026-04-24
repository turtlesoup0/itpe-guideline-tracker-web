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
import { KeywordInfo } from "@/components/keyword-info";

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

function formatYearMonth(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Guideline[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState<string>("");

  useEffect(() => {
    Promise.all([fetchGuidelines({ item_type: "announcement" }), fetchAgencies()])
      .then(([gl, ag]) => {
        setItems(gl);
        setAgencies(ag);
      })
      .catch((e) => setError(e.message));
  }, []);

  const agencyMap = useMemo(
    () => Object.fromEntries(agencies.map((a) => [a.id, a])),
    [agencies],
  );

  const agencyOptions = useMemo(() => {
    const map = new Map<number, { code: string; name: string; count: number }>();
    for (const g of items) {
      const a = agencyMap[g.agency_id];
      if (!a) continue;
      const ex = map.get(a.id);
      if (ex) ex.count++;
      else map.set(a.id, { code: a.code, name: a.short_name, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [items, agencyMap]);

  const filtered = useMemo(() => {
    let list = items;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          (agencyMap[g.agency_id]?.short_name || "").toLowerCase().includes(q),
      );
    }
    if (agencyFilter) {
      list = list.filter((g) => agencyMap[g.agency_id]?.code === agencyFilter);
    }
    // 게시일 내림차순 고정
    return [...list].sort((a, b) => {
      const ad = a.latest_published_date || "";
      const bd = b.latest_published_date || "";
      return bd.localeCompare(ad);
    });
  }, [items, search, agencyFilter, agencyMap]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">보도·발표</h1>
          <KeywordInfo itemType="announcement" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          각 기관의 보도자료·공지사항 게시판에서 수집된 {items.length}건
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-amber-600">백엔드 연결 실패: {error}</CardContent>
        </Card>
      )}

      {!error && items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="제목 또는 기관명으로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filtered.length}건
              {search || agencyFilter ? ` / ${items.length}건` : ""}
            </span>
          </div>

          {/* 기관 필터 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">기관</span>
            {agencyOptions.map((opt) => (
              <button
                key={opt.code}
                onClick={() => setAgencyFilter((p) => (p === opt.code ? "" : opt.code))}
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

      {!error && items.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p className="font-medium">수집된 보도·발표가 없습니다</p>
            <p className="text-sm mt-1">
              각 기관의 보도자료/공지사항 게시판 크롤링이 실행되면 여기에 표시됩니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 데스크톱 테이블 */}
      {filtered.length > 0 && (
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead className="w-[90px]">게시일 ↓</TableHead>
                <TableHead className="w-[90px]">기관</TableHead>
                <TableHead className="w-[90px]">분야</TableHead>
                <TableHead className="w-[60px]">링크</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((gl) => (
                <TableRow key={gl.id}>
                  <TableCell className="font-medium max-w-[420px]">
                    <div>{gl.title}</div>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums whitespace-nowrap">
                    {formatYearMonth(gl.latest_published_date)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{agencyMap[gl.agency_id]?.short_name || "-"}</span>
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

      {/* 모바일 카드 */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-2">
          {filtered.map((gl) => (
            <div key={gl.id} className="rounded-lg border p-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-sm font-medium leading-snug">{gl.title}</p>
                {gl.source_url && (
                  <a
                    href={gl.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-xs shrink-0"
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
