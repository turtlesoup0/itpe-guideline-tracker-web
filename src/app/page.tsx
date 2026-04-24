"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchDashboardSummary,
  type DashboardSummary,
  type AgencySummary,
  type RecentLegalBasis,
  type CrawlHealthItem,
} from "@/lib/api";

const CATEGORY_LABEL: Record<string, string> = {
  privacy: "개인정보",
  info_security: "정보보안",
  e_gov: "전자정부",
  ai: "AI",
  software: "SW",
  data: "데이터",
  cloud: "클라우드",
  finance: "금융",
  other: "기타",
};

const CATEGORY_COLOR: Record<string, string> = {
  privacy: "bg-rose-500",
  info_security: "bg-blue-500",
  e_gov: "bg-emerald-500",
  ai: "bg-violet-500",
  software: "bg-amber-500",
  data: "bg-cyan-500",
  cloud: "bg-sky-500",
  finance: "bg-orange-500",
  other: "bg-gray-400",
};

const HEALTH_LABEL: Record<string, string> = {
  never_crawled: "크롤 이력 없음",
  all_failed: "크롤 실패",
  zero_keyword_match: "키워드 매칭 없음",
  stale: "2주+ 미실행",
};

const HEALTH_SEVERITY: Record<string, "warn" | "info"> = {
  never_crawled: "warn",
  all_failed: "warn",
  zero_keyword_match: "info",   // 정상 상태일 수 있음 (키워드 불일치)
  stale: "warn",
};

const TYPE_LABEL: Record<string, string> = {
  gosi: "고시",
  hunryeong: "훈령",
  yegyu: "예규",
};

const TYPE_COLOR: Record<string, string> = {
  gosi: "bg-blue-100 text-blue-800",
  hunryeong: "bg-purple-100 text-purple-800",
  yegyu: "bg-amber-100 text-amber-800",
};

function statusBadge(status: string | null) {
  if (!status) return <Badge variant="outline">미실행</Badge>;
  if (status === "success")
    return <Badge className="bg-emerald-500 text-white">성공</Badge>;
  if (status === "failed") return <Badge variant="destructive">실패</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="mt-2 text-muted-foreground">
            IT 가이드라인 추적 현황을 한눈에 확인합니다.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6 text-amber-600">
            백엔드 연결 실패: {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="mt-2 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="mt-2 text-muted-foreground">
          {data.agency_count}개 기관의 IT 가이드라인 발행 현황과 법적 근거를
          추적합니다.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>추적 기관</CardDescription>
            <CardTitle className="text-3xl">{data.agency_count}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">정부/공공기관</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>법적 근거</CardDescription>
            <CardTitle className="text-3xl">{data.legal_basis_count}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-xs">
              <span className="text-blue-600">
                고시 {data.gosi_count}
              </span>
              <span className="text-purple-600">
                훈령 {data.hunryeong_count}
              </span>
              <span className="text-amber-600">
                예규 {data.yegyu_count}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>수집 가이드라인</CardDescription>
            <CardTitle className="text-3xl">
              {data.guideline_count || "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              크롤링으로 수집된 발행물
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>최근 30일 변경</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {data.recently_updated_count || "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              신규 등록 + 버전 갱신
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Crawl Info + Category Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 최종 갱신일 + 건전성 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">크롤링 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">최종 갱신일</span>
              <span className="text-sm font-medium">
                {data.last_global_crawl_at
                  ? `${new Date(data.last_global_crawl_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} (${timeAgo(data.last_global_crawl_at)})`
                  : "-"}
              </span>
            </div>
            {data.crawl_health.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-sm text-muted-foreground">건전성 경고</span>
                {data.crawl_health.map((h: CrawlHealthItem) => {
                  const severity = HEALTH_SEVERITY[h.issue] || "warn";
                  return (
                    <div key={h.agency_code} className="flex items-start gap-2 text-sm">
                      <Badge
                        variant={severity === "warn" ? "destructive" : "secondary"}
                        className="text-xs px-1.5 py-0 shrink-0"
                      >
                        {h.agency_code}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <span className={severity === "warn" ? "text-amber-600" : "text-muted-foreground"}>
                          {HEALTH_LABEL[h.issue] || h.issue}
                        </span>
                        {h.detail && (
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {h.detail}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {data.crawl_health.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <span>&#10003;</span> 전 기관 크롤링 정상
              </div>
            )}
          </CardContent>
        </Card>

        {/* 카테고리 분포 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">도메인 분포</CardTitle>
            <CardDescription>카테고리별 수집 가이드라인</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.category_stats || {})
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => {
                  const total = Object.values(data.category_stats || {}).reduce((s, v) => s + v, 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs w-16 text-right text-muted-foreground">
                        {CATEGORY_LABEL[cat] || cat}
                      </span>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${CATEGORY_COLOR[cat] || "bg-gray-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8">{count}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Agency Status Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">기관별 수집 현황</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">기관</TableHead>
                <TableHead>기관명</TableHead>
                <TableHead className="text-center">크롤링 타겟</TableHead>
                <TableHead className="text-center">법적 근거</TableHead>
                <TableHead className="text-center">가이드라인</TableHead>
                <TableHead className="text-center">최근 크롤링</TableHead>
                <TableHead className="text-center">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.agencies.map((agency: AgencySummary) => (
                <TableRow key={agency.code}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {agency.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{agency.short_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {agency.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {agency.crawl_target_count}
                  </TableCell>
                  <TableCell className="text-center">
                    {agency.legal_basis_count > 0 ? (
                      <span className="font-medium text-blue-600">
                        {agency.legal_basis_count}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {agency.guideline_count > 0 ? (
                      <span className="font-medium text-emerald-600">
                        {agency.guideline_count}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {timeAgo(agency.last_crawl_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    {statusBadge(agency.last_crawl_status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Recent Legal Bases */}
      {data.recent_legal_bases.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-xl font-semibold mb-4">
              최근 수집된 법적 근거
            </h2>
            <div className="grid gap-3">
              {data.recent_legal_bases.map((lb: RecentLegalBasis) => (
                <Card key={lb.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3 flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={TYPE_COLOR[lb.basis_type] || ""}
                    >
                      {TYPE_LABEL[lb.basis_type] || lb.basis_type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lb.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lb.agency_name}
                        {lb.promulgation_date && (
                          <> &middot; 공포일 {lb.promulgation_date}</>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(lb.created_at)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
