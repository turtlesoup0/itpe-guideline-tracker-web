"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/category-dot";
import { cn } from "@/lib/utils";
import { fetchGuidelines, fetchAgencies, type Guideline, type Agency } from "@/lib/api";
import { KeywordInfo } from "@/components/keyword-info";

function formatYearMonth(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function SourceLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="원문 보기"
      className="inline-flex text-primary hover:text-primary-hover"
    >
      <svg
        className="size-[13px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 4h6v6" />
        <path d="M20 4l-8.5 8.5" />
        <path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5" />
      </svg>
    </a>
  );
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Guideline[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");

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
    if (agencyFilter) list = list.filter((g) => agencyMap[g.agency_id]?.code === agencyFilter);

    // 게시일 내림차순 고정
    return [...list].sort((a, b) =>
      (b.latest_published_date || "").localeCompare(a.latest_published_date || ""),
    );
  }, [items, search, agencyFilter, agencyMap]);

  const hasFilter = !!(search || agencyFilter);

  const chipClass = (on: boolean) =>
    cn(
      "inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors",
      on
        ? "border-primary bg-primary-soft font-medium text-primary"
        : "text-muted-foreground hover:border-border-strong hover:text-foreground",
    );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[23px] font-semibold tracking-tight">보도·발표</h1>
            <KeywordInfo itemType="announcement" />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            각 기관의 보도자료·공지사항 게시판에서 수집한 발표성 게시물입니다.
          </p>
        </div>
        <span className="pb-1 text-xs text-muted-foreground tabular-nums">
          {hasFilter ? `${filtered.length}건 / ${items.length}건` : `${items.length}건`}
        </span>
      </div>

      {error && (
        <Card className="gap-0 px-4 py-5 text-sm text-warning">백엔드 연결 실패: {error}</Card>
      )}

      {!error && items.length > 0 && (
        <Card className="gap-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-3">
            <div className="relative min-w-[220px] flex-1 sm:max-w-[336px]">
              <svg
                className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.8-3.8" />
              </svg>
              <input
                type="text"
                placeholder="제목 또는 기관명 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-lg border bg-card pr-2.5 pl-8 text-[13px] outline-none placeholder:text-faint focus:border-primary focus:ring-3 focus:ring-primary-soft"
              />
            </div>

            <span className="text-[11.5px] text-faint">정렬</span>
            <span className="inline-flex h-[30px] items-center rounded-lg border border-dashed px-2.5 text-xs text-muted-foreground">
              게시일 ↓
            </span>

            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setAgencyFilter("");
                }}
                className="ml-auto inline-flex h-[30px] items-center gap-1.5 rounded-lg border-transparent px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <svg
                  className="size-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                필터 초기화
              </button>
            )}
          </div>

          <div className="flex items-start gap-2.5 border-t px-3.5 py-3">
            <span className="w-7 shrink-0 pt-1.5 text-[11.5px] text-faint">기관</span>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {agencyOptions.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setAgencyFilter((p) => (p === opt.code ? "" : opt.code))}
                  className={chipClass(agencyFilter === opt.code)}
                >
                  {opt.name}
                  <span className="text-[11.5px] opacity-70 tabular-nums">{opt.count}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!error && items.length === 0 && (
        <Card className="gap-0 space-y-1.5 px-4 py-11 text-center">
          <p className="font-medium">수집된 보도·발표가 없습니다</p>
          <p className="text-sm text-muted-foreground">
            각 기관의 보도자료·공지사항 게시판 크롤링이 실행되면 여기에 표시됩니다.
          </p>
        </Card>
      )}

      {/* 데스크톱: 표 */}
      {filtered.length > 0 && (
        <Card className="hidden gap-0 overflow-hidden md:block">
          {/* table-fixed: 긴 제목이 게시일·원문 열을 침범하지 않게 한다 */}
          <table className="w-full table-fixed border-collapse text-[13px]">
            <thead>
              <tr className="text-[11.5px] text-faint">
                <th className="border-b px-3.5 py-2.5 text-left font-medium">제목</th>
                <th className="w-[104px] border-b px-3.5 py-2.5 text-left font-medium">
                  분야
                </th>
                <th className="w-[96px] border-b px-3.5 py-2.5 text-left font-medium">
                  기관
                </th>
                <th className="w-[86px] border-b px-3.5 py-2.5 text-right font-medium">
                  게시일
                </th>
                <th className="w-[58px] border-b px-3.5 py-2.5 text-center font-medium">
                  원문
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((gl) => (
                <tr
                  key={gl.id}
                  className="transition-colors last:[&>td]:border-b-0 hover:bg-muted"
                >
                  <td className="border-b px-3.5 py-2 font-medium break-words">
                    {gl.title}
                  </td>
                  <td className="border-b px-3.5 py-2">
                    <CategoryTag category={gl.category} />
                  </td>
                  <td className="border-b px-3.5 py-2 text-xs text-muted-foreground">
                    {agencyMap[gl.agency_id]?.short_name || "-"}
                  </td>
                  <td className="border-b px-3.5 py-2 text-right text-xs text-muted-foreground tabular-nums">
                    {formatYearMonth(gl.latest_published_date)}
                  </td>
                  <td className="border-b px-3.5 py-2 text-center">
                    {gl.source_url && <SourceLink url={gl.source_url} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* 모바일: 카드 목록 */}
      {filtered.length > 0 && (
        <div className="space-y-2 md:hidden">
          {filtered.map((gl) => (
            <Card key={gl.id} className="space-y-2 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 text-sm leading-snug font-medium">
                  {gl.title}
                </p>
                {gl.source_url && <SourceLink url={gl.source_url} />}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CategoryTag category={gl.category} />
                <span className="text-xs text-muted-foreground">
                  {agencyMap[gl.agency_id]?.short_name || "-"}
                </span>
                <span className="text-xs text-faint tabular-nums">
                  {formatYearMonth(gl.latest_published_date)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {hasFilter && filtered.length === 0 && items.length > 0 && (
        <Card className="gap-0 px-4 py-11 text-center text-sm text-muted-foreground">
          조건에 맞는 보도·발표가 없습니다. 필터를 지우고 다시 시도해 보세요.
        </Card>
      )}
    </div>
  );
}
