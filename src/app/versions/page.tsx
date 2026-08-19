"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/category-dot";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import { fetchRecentChanges, type RecentChange } from "@/lib/api";

const PERIOD_OPTIONS = [
  { value: 7, label: "7일" },
  { value: 30, label: "30일" },
  { value: 90, label: "90일" },
  { value: 365, label: "1년" },
];

const TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "new", label: "신규" },
  { value: "updated", label: "갱신" },
] as const;

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function VersionsPage() {
  const [changes, setChanges] = useState<RecentChange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(90);
  const [agencyFilter, setAgencyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "new" | "updated">("");

  useEffect(() => {
    fetchRecentChanges({ days, limit: 200 })
      .then(setChanges)
      .catch((e) => setError(e.message));
  }, [days]);

  const agencies = useMemo(() => {
    const set = new Map<string, string>();
    for (const c of changes) set.set(c.agency_code, c.agency_name);
    return Array.from(set.entries());
  }, [changes]);

  const filtered = useMemo(() => {
    let list = changes;
    if (agencyFilter) list = list.filter((c) => c.agency_code === agencyFilter);
    if (typeFilter) list = list.filter((c) => c.change_type === typeFilter);
    return list;
  }, [changes, agencyFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      newCount: filtered.filter((c) => c.change_type === "new").length,
      updatedCount: filtered.filter((c) => c.change_type === "updated").length,
    }),
    [filtered],
  );

  const segClass = (on: boolean) =>
    cn(
      "inline-flex h-[30px] items-center rounded-lg border px-2.5 text-xs transition-colors",
      on
        ? "border-primary bg-primary-soft font-medium text-primary"
        : "text-muted-foreground hover:border-border-strong hover:text-foreground",
    );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[23px] font-semibold tracking-tight">변경 이력</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            최근 신규 등록 또는 개정된 가이드라인을 추적합니다.
          </p>
        </div>
        <span className="pb-1 text-xs text-muted-foreground tabular-nums">
          {filtered.length}건
        </span>
      </div>

      {error && (
        <Card className="gap-0 px-4 py-5 text-sm text-warning">백엔드 연결 실패: {error}</Card>
      )}

      {/* 지표 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex flex-col gap-1.5 px-4 py-3.5">
          <span className="text-xs font-medium text-muted-foreground">전체 변경</span>
          <span className="text-[30px] leading-none font-semibold tracking-tighter tabular-nums">
            {stats.total}
          </span>
        </Card>
        <Card className="flex flex-col gap-1.5 px-4 py-3.5">
          <span className="text-xs font-medium text-muted-foreground">신규 등록</span>
          <span className="text-[30px] leading-none font-semibold tracking-tighter text-primary tabular-nums">
            {stats.newCount}
          </span>
        </Card>
        <Card className="flex flex-col gap-1.5 px-4 py-3.5">
          <span className="text-xs font-medium text-muted-foreground">버전 갱신</span>
          <span className="text-[30px] leading-none font-semibold tracking-tighter tabular-nums">
            {stats.updatedCount}
          </span>
        </Card>
      </div>

      {/* 필터 */}
      <Card className="flex flex-row flex-wrap items-center gap-x-2.5 gap-y-2 px-3.5 py-3">
        <span className="text-[11.5px] text-faint">기간</span>
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDays(opt.value)}
            className={segClass(days === opt.value)}
          >
            {opt.label}
          </button>
        ))}

        <span className="ml-2 text-[11.5px] text-faint">유형</span>
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTypeFilter(opt.value)}
            className={segClass(typeFilter === opt.value)}
          >
            {opt.label}
          </button>
        ))}

        <span className="ml-2 text-[11.5px] text-faint">기관</span>
        <select
          value={agencyFilter}
          onChange={(e) => setAgencyFilter(e.target.value)}
          className="h-[30px] rounded-lg border bg-card px-2 text-xs text-muted-foreground outline-none focus:border-primary focus:ring-3 focus:ring-primary-soft"
        >
          <option value="">전체</option>
          {agencies.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </Card>

      {/* 표 */}
      {filtered.length > 0 && (
        <Card className="gap-0 overflow-hidden">
          {/* table-fixed: 긴 제목이 게시일·감지 열을 침범하지 않게 한다 */}
          <table className="w-full table-fixed border-collapse text-[13px]">
            <thead>
              <tr className="text-[11.5px] text-faint">
                <th className="w-[62px] border-b px-3.5 py-2.5 text-left font-medium">
                  유형
                </th>
                <th className="border-b px-3.5 py-2.5 text-left font-medium">제목</th>
                <th className="w-[100px] border-b px-3.5 py-2.5 text-left font-medium">
                  분야
                </th>
                <th className="w-[92px] border-b px-3.5 py-2.5 text-left font-medium">
                  기관
                </th>
                <th className="w-[150px] border-b px-3.5 py-2.5 text-right font-medium">
                  게시일
                </th>
                <th className="w-[78px] border-b px-3.5 py-2.5 text-right font-medium">
                  감지
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr
                  key={`${item.guideline_id}-${i}`}
                  className="transition-colors last:[&>td]:border-b-0 hover:bg-muted"
                >
                  <td className="border-b px-3.5 py-2">
                    {item.change_type === "new" ? (
                      <Tag tone="primary">신규</Tag>
                    ) : (
                      <Tag>갱신</Tag>
                    )}
                  </td>
                  <td className="border-b px-3.5 py-2 break-words">
                    <Link
                      href={`/guidelines/${item.guideline_id}`}
                      className="font-medium underline-offset-2 hover:text-primary hover:underline"
                    >
                      {item.title}
                    </Link>
                    {item.version_label && (
                      <span className="ml-2 text-xs text-faint">{item.version_label}</span>
                    )}
                    {item.version_count > 1 && (
                      <span className="ml-2 text-xs text-faint">
                        버전 {item.version_count}
                      </span>
                    )}
                  </td>
                  <td className="border-b px-3.5 py-2">
                    <CategoryTag category={item.category} />
                  </td>
                  <td className="border-b px-3.5 py-2 text-xs text-muted-foreground">
                    {item.agency_name}
                  </td>
                  <td className="border-b px-3.5 py-2 text-right text-xs tabular-nums">
                    {item.previous_published_date ? (
                      <div className="flex flex-col leading-tight">
                        <span className="text-faint line-through">
                          {formatDate(item.previous_published_date)}
                          {item.previous_version_label && (
                            <span className="ml-1">({item.previous_version_label})</span>
                          )}
                        </span>
                        <span className="font-medium text-primary">
                          → {formatDate(item.published_date)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {formatDate(item.published_date)}
                      </span>
                    )}
                  </td>
                  <td className="border-b px-3.5 py-2 text-right text-xs text-faint">
                    {timeAgo(item.detected_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!error && filtered.length === 0 && changes.length > 0 && (
        <Card className="gap-0 px-4 py-11 text-center text-sm text-muted-foreground">
          선택한 기간·유형·기관에 해당하는 변경 이력이 없습니다.
        </Card>
      )}

      {!error && changes.length === 0 && (
        <Card className="gap-0 space-y-1.5 px-4 py-11 text-center">
          <p className="font-medium">변경 이력이 없습니다</p>
          <p className="text-sm text-muted-foreground">
            크롤링이 실행되면 신규·갱신 가이드라인이 여기에 표시됩니다.
          </p>
        </Card>
      )}
    </div>
  );
}
