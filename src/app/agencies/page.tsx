"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CodeChip, StatusDot, Tag } from "@/components/ui/tag";
import {
  fetchAgencies,
  fetchCrawlStatus,
  triggerCrawl,
  type Agency,
  type CrawlStatus,
} from "@/lib/api";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAgencies(), fetchCrawlStatus()])
      .then(([ag, st]) => {
        setAgencies(ag);
        setStatuses(st);
      })
      .catch((e) => setError(e.message));
  }, []);

  const statusMap = Object.fromEntries(statuses.map((s) => [s.agency_code, s]));

  async function handleCrawl(code: string) {
    setCrawling(code);
    setResults((r) => ({ ...r, [code]: "크롤링 중…" }));
    try {
      const res = (await triggerCrawl(code)) as Array<{
        success: boolean;
        items_count: number;
        config_label: string;
      }>;
      const summary = res
        .map((r) => `${r.config_label}: ${r.success ? r.items_count + "건" : "실패"}`)
        .join(", ");
      setResults((r) => ({ ...r, [code]: summary }));
      setStatuses(await fetchCrawlStatus());
    } catch (e) {
      setResults((r) => ({ ...r, [code]: `에러: ${e}` }));
    } finally {
      setCrawling(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[23px] font-semibold tracking-tight">추적 기관</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            기관별 크롤링 설정과 실행 현황을 관리합니다.
          </p>
        </div>
        {agencies.length > 0 && (
          <span className="pb-1 text-xs text-muted-foreground tabular-nums">
            {agencies.length}개 기관
          </span>
        )}
      </div>

      {error && (
        <Card className="gap-0 px-4 py-5 text-sm text-warning">백엔드 연결 실패: {error}</Card>
      )}

      <div className="space-y-3">
        {agencies.map((agency) => {
          const st = statusMap[agency.code];
          return (
            <Card key={agency.code} className="gap-0 overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{agency.short_name}</span>
                    <CodeChip>{agency.code}</CodeChip>
                    <span className="text-xs text-faint">{agency.name}</span>
                  </div>
                  {agency.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {agency.description}
                    </p>
                  )}
                  {st?.last_run_at && (
                    <p className="mt-1.5 text-xs text-faint tabular-nums">
                      최근 실행 {new Date(st.last_run_at).toLocaleString("ko-KR")}
                      {" · "}
                      {st.last_status === "success" ? "성공" : st.last_status}
                      {st.last_items_new != null && ` · +${st.last_items_new}건`}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={crawling !== null}
                  onClick={() => handleCrawl(agency.code)}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs transition-colors hover:border-border-strong hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  {crawling === agency.code ? (
                    "크롤링 중…"
                  ) : (
                    <>
                      <svg
                        className="size-[13px]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 11.5A8 8 0 1 0 18.4 17" />
                        <path d="M20 5.5V11h-5.5" />
                      </svg>
                      수동 크롤링
                    </>
                  )}
                </button>
              </div>

              <table className="w-full table-fixed border-collapse text-[13px]">
                <thead>
                  <tr className="text-[11.5px] text-faint">
                    <th className="border-b px-4 py-2 text-left font-medium">대상</th>
                    <th className="w-[110px] border-b px-4 py-2 text-left font-medium">
                      방식
                    </th>
                    <th className="w-[80px] border-b px-4 py-2 text-left font-medium">
                      주기
                    </th>
                    <th className="w-[92px] border-b px-4 py-2 text-left font-medium">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agency.crawl_configs.map((config) => (
                    <tr key={config.id} className="last:[&>td]:border-b-0">
                      <td className="border-b px-4 py-2 break-words">
                        {config.url ? (
                          <a
                            href={config.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline-offset-2 hover:text-primary hover:underline"
                          >
                            {config.label}
                          </a>
                        ) : (
                          config.label
                        )}
                      </td>
                      <td className="border-b px-4 py-2">
                        <Tag>{SOURCE_LABEL[config.source_type?.toUpperCase()] || config.source_type}</Tag>
                      </td>
                      <td className="border-b px-4 py-2 text-xs text-muted-foreground">
                        {SCHEDULE_LABEL[config.schedule?.toUpperCase()] || config.schedule}
                      </td>
                      <td className="border-b px-4 py-2">
                        {config.is_active ? (
                          <StatusDot tone="ok">활성</StatusDot>
                        ) : (
                          <StatusDot tone="idle">비활성</StatusDot>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {results[agency.code] && (
                <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
                  결과: {results[agency.code]}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
