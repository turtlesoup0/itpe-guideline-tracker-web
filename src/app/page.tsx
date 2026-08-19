"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CategoryDot } from "@/components/category-dot";
import { CodeChip, StatusDot } from "@/components/ui/tag";
import { CATEGORY_ORDER, categoryLabel, categoryDotClass } from "@/lib/categories";
import {
  fetchDashboardSummary,
  type DashboardSummary,
  type AgencySummary,
  type CrawlHealthItem,
} from "@/lib/api";

const HEALTH_LABEL: Record<string, string> = {
  never_crawled: "크롤 이력 없음",
  all_failed: "크롤 실패",
  zero_keyword_match: "키워드 매칭 없음",
  stale: "2주+ 미실행",
};

// zero_keyword_match 는 정상 상태일 수 있음 (수집원에 해당 키워드가 없을 뿐)
const HEALTH_TONE: Record<string, "warn" | "idle"> = {
  never_crawled: "warn",
  all_failed: "warn",
  zero_keyword_match: "idle",
  stale: "warn",
};

function crawlStatus(status: string | null) {
  if (!status) return <StatusDot tone="idle">미실행</StatusDot>;
  if (status === "success") return <StatusDot tone="ok">성공</StatusDot>;
  if (status === "failed") return <StatusDot tone="danger">실패</StatusDot>;
  return <StatusDot tone="warn">{status}</StatusDot>;
}

function timeAgo(isoStr: string | null): string {
  if (!isoStr) return "-";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(
    d.getHours(),
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function PageHeading({ children }: { children?: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight">대시보드</h1>
      {children}
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number | string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-1.5 px-4 py-3.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={`text-[30px] leading-none font-semibold tracking-tighter tabular-nums ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </span>
      <span className="text-[11.5px] text-faint">{hint}</span>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardSummary()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeading>
          <p className="mt-1.5 text-sm text-muted-foreground">
            IT 가이드라인 추적 현황을 한눈에 확인합니다.
          </p>
        </PageHeading>
        <Card className="gap-0 px-4 py-5 text-sm text-warning">
          백엔드 연결 실패: {error}
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <PageHeading>
          <p className="mt-1.5 text-sm text-muted-foreground">불러오는 중…</p>
        </PageHeading>
      </div>
    );
  }

  const crawlTargets = data.agencies.reduce((s, a) => s + a.crawl_target_count, 0);
  const categoryTotal = Object.values(data.category_stats || {}).reduce(
    (s, v) => s + v,
    0,
  );
  const categories = CATEGORY_ORDER.filter((key) => data.category_stats?.[key]).sort(
    (a, b) => (data.category_stats[b] ?? 0) - (data.category_stats[a] ?? 0),
  );
  const unknownCategories = Object.keys(data.category_stats || {}).filter(
    (key) => !CATEGORY_ORDER.includes(key as never),
  );
  const shownCategories = [...categories, ...unknownCategories];

  return (
    <div className="space-y-5">
      <PageHeading>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {data.agency_count}개 기관의 가이드라인·보도자료 발행 현황을 추적합니다.
        </p>
      </PageHeading>

      {/* 지표 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="추적 기관"
          value={data.agency_count}
          hint={`크롤 타겟 ${crawlTargets}개`}
        />
        <Tile
          label="가이드라인"
          value={data.guideline_count || "-"}
          hint="수집 문서 기준"
        />
        <Tile
          label="보도·발표"
          value={data.announcement_count || "-"}
          hint="고시·법령 관련 발표"
        />
        <Tile
          label="최근 30일 변경"
          value={data.recently_updated_count || "-"}
          hint="신규 등록 + 버전 갱신"
          accent
        />
      </div>

      {/* 크롤링 현황 + 도메인 분포 */}
      <div className="grid items-start gap-4 lg:grid-cols-[404px_minmax(0,1fr)]">
        <Card className="gap-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <span className="text-[13px] font-semibold">크롤링 현황</span>
            {data.crawl_health.length === 0 ? (
              <StatusDot tone="ok">전 기관 정상</StatusDot>
            ) : (
              <StatusDot tone="warn">경고 {data.crawl_health.length}건</StatusDot>
            )}
          </div>

          <dl className="grid grid-cols-[76px_minmax(0,1fr)] gap-x-3.5 gap-y-2.5 px-4 py-3.5 text-[13px]">
            <dt className="text-xs text-faint">최종 갱신</dt>
            <dd className="m-0">
              {data.last_global_crawl_at ? (
                <>
                  {formatDateTime(data.last_global_crawl_at)}
                  <span className="text-faint">
                    {" "}
                    · {timeAgo(data.last_global_crawl_at)}
                  </span>
                </>
              ) : (
                "-"
              )}
            </dd>

            <dt className="text-xs text-faint">크롤 타겟</dt>
            <dd className="m-0">
              {crawlTargets}개
              <span className="text-faint">
                {" "}
                · 기관 평균 {(crawlTargets / (data.agency_count || 1)).toFixed(1)}개
              </span>
            </dd>
          </dl>

          {data.crawl_health.length > 0 && (
            <div className="space-y-2 border-t px-4 py-3.5">
              {data.crawl_health.map((h: CrawlHealthItem) => (
                <div key={h.agency_code} className="flex items-start gap-2.5 text-[13px]">
                  <CodeChip className="mt-px shrink-0">{h.agency_code}</CodeChip>
                  <div className="min-w-0 flex-1">
                    <StatusDot tone={HEALTH_TONE[h.issue] || "warn"}>
                      {HEALTH_LABEL[h.issue] || h.issue}
                    </StatusDot>
                    {h.detail && (
                      <span className="mt-0.5 block text-[11.5px] text-faint">
                        {h.detail}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="gap-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <span className="text-[13px] font-semibold">도메인 분포</span>
            <span className="text-[11.5px] text-faint">전체 {categoryTotal}건</span>
          </div>

          <div className="px-4 pt-3.5">
            <div className="flex h-2.5 gap-0.5">
              {shownCategories.map((key) => (
                <span
                  key={key}
                  className={`block rounded-[2px] ${categoryDotClass(key)}`}
                  style={{ flexGrow: data.category_stats[key] }}
                  title={`${categoryLabel(key)} ${data.category_stats[key]}건`}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-x-5 gap-y-2 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
            {shownCategories.map((key) => {
              const count = data.category_stats[key];
              const pct = categoryTotal > 0 ? (count / categoryTotal) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <CategoryDot category={key} />
                  <span className="text-muted-foreground">{categoryLabel(key)}</span>
                  <span className="ml-auto font-medium tabular-nums">{count}</span>
                  <span className="w-11 text-right text-[11.5px] text-faint tabular-nums">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 기관별 수집 현황 */}
      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-muted-foreground">
          기관별 수집 현황
        </h2>
        <Card className="gap-0 overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-[11.5px] font-medium text-faint">
                <th className="w-[86px] border-b px-3.5 py-2.5 text-left font-medium">
                  기관
                </th>
                <th className="border-b px-3.5 py-2.5 text-left font-medium">기관명</th>
                <th className="w-[86px] border-b px-3.5 py-2.5 text-right font-medium">
                  크롤 타겟
                </th>
                <th className="w-[86px] border-b px-3.5 py-2.5 text-right font-medium">
                  수집 문서
                </th>
                <th className="w-[100px] border-b px-3.5 py-2.5 text-right font-medium">
                  최근 크롤링
                </th>
                <th className="w-[96px] border-b px-3.5 py-2.5 text-left font-medium">
                  상태
                </th>
              </tr>
            </thead>
            <tbody>
              {[...data.agencies]
                .sort((a, b) => b.guideline_count - a.guideline_count)
                .map((agency: AgencySummary) => (
                  <tr
                    key={agency.code}
                    className="transition-colors last:[&>td]:border-b-0 hover:bg-muted"
                  >
                    <td className="border-b px-3.5 py-2">
                      <CodeChip>{agency.code}</CodeChip>
                    </td>
                    <td className="border-b px-3.5 py-2">
                      <span className="font-medium">{agency.short_name}</span>
                      <span className="ml-2 text-xs text-faint">{agency.name}</span>
                    </td>
                    <td className="border-b px-3.5 py-2 text-right tabular-nums">
                      {agency.crawl_target_count}
                    </td>
                    <td className="border-b px-3.5 py-2 text-right font-medium tabular-nums">
                      {agency.guideline_count > 0 ? (
                        agency.guideline_count
                      ) : (
                        <span className="font-normal text-faint">-</span>
                      )}
                    </td>
                    <td className="border-b px-3.5 py-2 text-right text-xs text-muted-foreground tabular-nums">
                      {timeAgo(agency.last_crawl_at)}
                    </td>
                    <td className="border-b px-3.5 py-2">
                      {crawlStatus(agency.last_crawl_status)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* 최근 수집된 항목 */}
      {data.recent_guidelines && data.recent_guidelines.length > 0 && (
        <section>
          <h2 className="mb-2 text-[13px] font-semibold text-muted-foreground">
            최근 수집된 항목
          </h2>
          <Card className="gap-0 overflow-hidden">
            <div className="flex items-center gap-3 border-b bg-muted px-4 py-2 text-[11.5px] text-faint">
              <span className="w-[74px] shrink-0">게시일</span>
              <span className="flex-1">제목</span>
              <span className="w-[92px] shrink-0">기관</span>
              <span className="w-[62px] shrink-0 text-right">감지</span>
            </div>
            {data.recent_guidelines.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 border-b px-4 py-2 text-[13px] transition-colors last:border-b-0 hover:bg-muted"
              >
                <span className="w-[74px] shrink-0 text-xs text-faint tabular-nums">
                  {r.published_date || "-"}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {r.title}
                  {r.version_label && (
                    <span className="ml-2 text-xs text-faint">{r.version_label}</span>
                  )}
                </span>
                <span className="w-[92px] shrink-0 truncate text-xs text-muted-foreground">
                  {r.agency_name}
                </span>
                <span className="w-[62px] shrink-0 text-right text-xs text-faint">
                  {r.detected_at ? timeAgo(r.detected_at) : ""}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
