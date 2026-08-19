"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CategoryDot, CategoryTag } from "@/components/category-dot";
import { Tag } from "@/components/ui/tag";
import { CATEGORY_ORDER, categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { fetchGuidelines, fetchAgencies, type Guideline, type Agency } from "@/lib/api";
import { KeywordInfo } from "@/components/keyword-info";

/** 표 밀도를 위해 게시일은 연·월까지만 (2026.08) */
function formatYearMonth(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function VersionBadge({ count }: { count: number }) {
  return (
    <Tag className="ml-1.5 align-[1px]">
      <svg
        className="size-2.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinejoin="round"
      >
        <path d="M12 3l8.5 4.6-8.5 4.6-8.5-4.6L12 3z" />
        <path d="M3.5 12.4l8.5 4.6 8.5-4.6" />
      </svg>
      버전 {count}
    </Tag>
  );
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

export default function GuidelinesPage() {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [groupByAgency, setGroupByAgency] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");

  useEffect(() => {
    Promise.all([fetchGuidelines({ item_type: "guideline" }), fetchAgencies()])
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

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of guidelines) map[g.category] = (map[g.category] || 0) + 1;
    return map;
  }, [guidelines]);

  const agencyOptions = useMemo(() => {
    const map = new Map<number, { code: string; name: string; count: number }>();
    for (const g of guidelines) {
      const a = agencyMap[g.agency_id];
      if (!a) continue;
      const existing = map.get(a.id);
      if (existing) existing.count++;
      else map.set(a.id, { code: a.code, name: a.short_name, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [guidelines, agencyMap]);

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
    if (categoryFilter) list = list.filter((g) => g.category === categoryFilter);
    if (agencyFilter)
      list = list.filter((g) => agencyMap[g.agency_id]?.code === agencyFilter);

    // 정렬: 게시일 내림차순 고정 + 분야/기관 그룹핑 (AND 조건)
    return [...list].sort((a, b) => {
      if (groupByCategory) {
        const cmp = categoryLabel(a.category).localeCompare(
          categoryLabel(b.category),
          "ko",
        );
        if (cmp !== 0) return cmp;
      }
      if (groupByAgency) {
        const cmp = (agencyMap[a.agency_id]?.short_name || "").localeCompare(
          agencyMap[b.agency_id]?.short_name || "",
          "ko",
        );
        if (cmp !== 0) return cmp;
      }
      return (b.latest_published_date || "").localeCompare(a.latest_published_date || "");
    });
  }, [
    guidelines,
    agencyMap,
    search,
    groupByCategory,
    groupByAgency,
    categoryFilter,
    agencyFilter,
  ]);

  const hasFilter = !!(search || categoryFilter || agencyFilter);
  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setAgencyFilter("");
  };

  const toggleClass = (on: boolean) =>
    cn(
      "inline-flex h-[30px] items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors",
      on
        ? "border-primary bg-primary-soft font-medium text-primary"
        : "text-muted-foreground hover:border-border-strong hover:text-foreground",
    );

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
            <h1 className="text-[23px] font-semibold tracking-tight">가이드라인</h1>
            <KeywordInfo itemType="guideline" />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            기관에서 수집한 가이드라인 문서. 보도·발표는 별도 탭에서 봅니다.
          </p>
        </div>
        <span className="pb-1 text-xs text-muted-foreground tabular-nums">
          {hasFilter
            ? `${filtered.length}건 / ${guidelines.length}건`
            : `${guidelines.length}건`}
        </span>
      </div>

      {error && (
        <Card className="gap-0 px-4 py-5 text-sm text-warning">백엔드 연결 실패: {error}</Card>
      )}

      {!error && guidelines.length > 0 && (
        <Card className="gap-0 overflow-hidden">
          {/* 검색 + 정렬 */}
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
            <button
              type="button"
              onClick={() => setGroupByCategory((v) => !v)}
              className={toggleClass(groupByCategory)}
            >
              분야별 묶기
            </button>
            <button
              type="button"
              onClick={() => setGroupByAgency((v) => !v)}
              className={toggleClass(groupByAgency)}
            >
              기관별 묶기
            </button>

            {hasFilter && (
              <button
                type="button"
                onClick={resetFilters}
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

          {/* 분야 필터 */}
          <div className="flex items-start gap-2.5 border-t px-3.5 py-3">
            <span className="w-7 shrink-0 pt-1.5 text-[11.5px] text-faint">분야</span>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {CATEGORY_ORDER.filter((key) => categoryCounts[key]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setCategoryFilter((prev) => (prev === key ? "" : key))
                  }
                  className={chipClass(categoryFilter === key)}
                >
                  <CategoryDot category={key} />
                  {categoryLabel(key)}
                  <span className="text-[11.5px] opacity-70 tabular-nums">
                    {categoryCounts[key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 기관 필터 */}
          <div className="flex items-start gap-2.5 border-t px-3.5 py-3">
            <span className="w-7 shrink-0 pt-1.5 text-[11.5px] text-faint">기관</span>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {agencyOptions.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() =>
                    setAgencyFilter((prev) => (prev === opt.code ? "" : opt.code))
                  }
                  className={chipClass(agencyFilter === opt.code)}
                >
                  {opt.name}
                  <span className="text-[11.5px] opacity-70 tabular-nums">
                    {opt.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!error && guidelines.length === 0 && (
        <Card className="gap-0 space-y-1.5 px-4 py-11 text-center">
          <p className="font-medium">아직 등록된 가이드라인이 없습니다</p>
          <p className="text-sm text-muted-foreground">
            크롤링으로 수집된 항목이 가이드라인으로 등록되면 여기에 표시됩니다.
          </p>
        </Card>
      )}

      {/* 데스크톱: 표 */}
      {filtered.length > 0 && (
        <Card className="hidden gap-0 overflow-hidden md:block">
          {/* table-fixed: 긴 제목이 열 폭을 밀어내 게시일·원문 열을 침범하지 않게 한다 */}
          <table className="w-full table-fixed border-collapse text-[13px]">
            <thead>
              <tr className="text-[11.5px] text-faint">
                <th className="border-b px-3.5 py-2.5 text-left font-medium">제목</th>
                <th className="w-[104px] border-b px-3.5 py-2.5 text-left font-medium">
                  분야{groupByCategory && <span className="ml-0.5 text-primary">▸</span>}
                </th>
                <th className="w-[96px] border-b px-3.5 py-2.5 text-left font-medium">
                  기관{groupByAgency && <span className="ml-0.5 text-primary">▸</span>}
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
                  <td className="border-b px-3.5 py-2 break-words">
                    <Link
                      href={`/guidelines/${gl.id}`}
                      className="font-medium underline-offset-2 hover:text-primary hover:underline"
                    >
                      {gl.title}
                    </Link>
                    {gl.version_count > 1 && <VersionBadge count={gl.version_count} />}
                    {gl.duplicate_of_id && (
                      <Link
                        href={`/guidelines/${gl.duplicate_of_id}`}
                        title="다른 기관에서 동일 PDF가 이미 수집됨"
                      >
                        <Tag tone="warning" className="ml-1.5 align-[1px]">
                          중복 콘텐츠
                        </Tag>
                      </Link>
                    )}
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
                <Link
                  href={`/guidelines/${gl.id}`}
                  className="min-w-0 flex-1 text-sm leading-snug font-medium"
                >
                  {gl.title}
                </Link>
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
                {gl.version_count > 1 && <Tag>버전 {gl.version_count}</Tag>}
                {gl.duplicate_of_id && <Tag tone="warning">중복 콘텐츠</Tag>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {hasFilter && filtered.length === 0 && guidelines.length > 0 && (
        <Card className="gap-0 px-4 py-11 text-center text-sm text-muted-foreground">
          조건에 맞는 가이드라인이 없습니다. 필터를 지우고 다시 시도해 보세요.
        </Card>
      )}
    </div>
  );
}
