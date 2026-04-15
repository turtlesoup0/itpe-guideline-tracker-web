"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAgencies, fetchCrawlStatus, triggerCrawl, type Agency, type CrawlStatus } from "@/lib/api";

const SCHEDULE_LABEL: Record<string, string> = {
  DAILY: "매일",
  WEEKLY: "매주",
  MONTHLY: "매월",
  QUARTERLY: "분기",
};

const SOURCE_LABEL: Record<string, string> = {
  RSS: "RSS",
  BBS_LIST: "BBS",
  LAW_API: "법제처 API",
};

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [statuses, setStatuses] = useState<CrawlStatus[]>([]);
  const [crawling, setCrawling] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([fetchAgencies(), fetchCrawlStatus()])
      .then(([ag, st]) => {
        setAgencies(ag);
        setStatuses(st);
      })
      .catch(console.error);
  }, []);

  const statusMap = Object.fromEntries(statuses.map((s) => [s.agency_code, s]));

  async function handleCrawl(code: string) {
    setCrawling(code);
    setResults((r) => ({ ...r, [code]: "크롤링 중..." }));
    try {
      const res = (await triggerCrawl(code)) as Array<{ success: boolean; items_count: number; config_label: string }>;
      const summary = res
        .map((r) => `${r.config_label}: ${r.success ? r.items_count + "건" : "실패"}`)
        .join(", ");
      setResults((r) => ({ ...r, [code]: summary }));
      // 상태 새로고침
      const st = await fetchCrawlStatus();
      setStatuses(st);
    } catch (e) {
      setResults((r) => ({ ...r, [code]: `에러: ${e}` }));
    } finally {
      setCrawling(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">추적 기관</h1>
        <p className="mt-2 text-muted-foreground">
          9개 정부/공공기관의 크롤링 설정과 실행 현황을 관리합니다.
        </p>
      </div>

      {agencies.map((agency) => {
        const st = statusMap[agency.code];
        return (
          <Card key={agency.code}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {agency.short_name}
                    <Badge variant="secondary" className="ml-2">{agency.code}</Badge>
                  </CardTitle>
                  <CardDescription>{agency.name}</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={crawling !== null}
                  onClick={() => handleCrawl(agency.code)}
                >
                  {crawling === agency.code ? "크롤링 중..." : "수동 크롤링"}
                </Button>
              </div>
              {agency.description && (
                <p className="text-sm text-muted-foreground mt-1">{agency.description}</p>
              )}
            </CardHeader>
            <CardContent>
              {/* 크롤링 설정 테이블 */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>대상</TableHead>
                    <TableHead>방식</TableHead>
                    <TableHead>주기</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agency.crawl_configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.label}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {SOURCE_LABEL[config.source_type] || config.source_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{SCHEDULE_LABEL[config.schedule] || config.schedule}</TableCell>
                      <TableCell>
                        {config.is_active ? (
                          <Badge className="bg-emerald-500 text-white">활성</Badge>
                        ) : (
                          <Badge variant="secondary">비활성</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 크롤링 결과 */}
              {results[agency.code] && (
                <p className="mt-3 text-sm text-muted-foreground">
                  결과: {results[agency.code]}
                </p>
              )}

              {/* 최근 크롤링 상태 */}
              {st && st.last_run_at && (
                <p className="mt-2 text-xs text-muted-foreground">
                  최근 실행: {new Date(st.last_run_at).toLocaleString("ko-KR")} —{" "}
                  {st.last_status === "success" ? "성공" : st.last_status}
                  {st.last_items_new != null && ` (+${st.last_items_new}건)`}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
