"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchAgencies, fetchCrawlStatus, type Agency, type CrawlStatus } from "@/lib/api";

/**
 * 대시보드 메인 페이지.
 * 백엔드 연동: agencies + crawl status를 동적으로 표시합니다.
 * 백엔드 미연결 시 폴백 데이터를 보여줍니다.
 */

const FALLBACK_AGENCIES = [
  { code: "PIPC", short_name: "개인정보위", name: "개인정보보호위원회", crawl_configs: [{}, {}] },
  { code: "MSIT", short_name: "과기정통부", name: "과학기술정보통신부", crawl_configs: [{}] },
  { code: "KISA", short_name: "KISA", name: "한국인터넷진흥원", crawl_configs: [{}, {}] },
  { code: "NIS", short_name: "NCSC", name: "국가사이버안보센터", crawl_configs: [{}] },
  { code: "FSC", short_name: "금융위", name: "금융위원회", crawl_configs: [{}, {}, {}] },
  { code: "NIA", short_name: "NIA", name: "한국지능정보사회진흥원", crawl_configs: [{}] },
  { code: "MOIS", short_name: "행안부", name: "행정안전부", crawl_configs: [{}, {}] },
  { code: "SPRI", short_name: "SPRi", name: "소프트웨어정책연구소", crawl_configs: [{}] },
  { code: "KCC", short_name: "방통위", name: "방송통신위원회", crawl_configs: [{}] },
] as unknown as Agency[];

function statusBadge(status: string | null) {
  if (!status) return <Badge variant="outline">미실행</Badge>;
  if (status === "success") return <Badge className="bg-emerald-500 text-white">성공</Badge>;
  if (status === "failed") return <Badge variant="destructive">실패</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export default function DashboardPage() {
  const [agencies, setAgencies] = useState<Agency[]>(FALLBACK_AGENCIES);
  const [statuses, setStatuses] = useState<CrawlStatus[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    Promise.all([fetchAgencies(), fetchCrawlStatus()])
      .then(([ag, st]) => {
        setAgencies(ag);
        setStatuses(st);
        setConnected(true);
      })
      .catch(() => setConnected(false));
  }, []);

  const statusMap = Object.fromEntries(statuses.map((s) => [s.agency_code, s]));
  const totalTargets = agencies.reduce((n, a) => n + a.crawl_configs.length, 0);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="mt-2 text-muted-foreground">
          정보보안 / 개인정보 / SW 관련 가이드라인의 발행 현황과 갭을 한눈에 파악합니다.
        </p>
        {!connected && (
          <p className="mt-1 text-xs text-amber-600">
            백엔드 미연결 — 정적 데이터를 표시합니다.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>추적 기관</CardDescription>
            <CardTitle className="text-3xl">{agencies.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">정부/공공기관</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>크롤링 타겟</CardDescription>
            <CardTitle className="text-3xl">{totalTargets}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">RSS + BBS + API</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>최근 성공</CardDescription>
            <CardTitle className="text-3xl">
              {statuses.filter((s) => s.last_status === "success").length || "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">크롤링 성공 기관 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>실패/미실행</CardDescription>
            <CardTitle className="text-3xl">
              {statuses.length
                ? statuses.filter((s) => s.last_status !== "success").length
                : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">확인 필요</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Agency Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">추적 대상 기관</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency) => {
            const st = statusMap[agency.code];
            return (
              <Card key={agency.code} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{agency.short_name}</CardTitle>
                    <Badge variant="secondary">{agency.code}</Badge>
                  </div>
                  <CardDescription className="text-xs">{agency.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">크롤링 타겟</span>
                    <span className="font-medium">{agency.crawl_configs.length}개</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">최근 크롤링</span>
                    {statusBadge(st?.last_status ?? null)}
                  </div>
                  {st?.last_items_new != null && st.last_items_new > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">수집 건수</span>
                      <span className="font-medium text-emerald-600">+{st.last_items_new}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Architecture Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">시스템 아키텍처</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>2계층 추적:</strong> 고시/훈령(법적 근거) &rarr; 위임 항목 매핑 &rarr;
            실제 발행 가이드라인 추적 &rarr; 갭 분석
          </p>
          <p>
            <strong>데이터 수집:</strong> RSS 피드(행안부, 금융위, KISA) + BBS 스크래핑(PIPC, KCC) +
            법제처 API(MSIT 고시/훈령)
          </p>
          <p>
            <strong>주기:</strong> 일간(RSS), 주간(BBS/법제처), 월간(NIS/NIA/SPRi)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
