"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/tag";
import { fetchGapSummary, type GapSummary } from "@/lib/api";

function gapStatus(status: string) {
  if (status === "missing") return <StatusDot tone="danger">미발행</StatusDot>;
  if (status === "outdated") return <StatusDot tone="warn">미갱신</StatusDot>;
  if (status === "resolved") return <StatusDot tone="ok">해소</StatusDot>;
  return <StatusDot tone="idle">{status}</StatusDot>;
}

function Tile({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <Card className="flex flex-col gap-1.5 px-4 py-3.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={`text-[30px] leading-none font-semibold tracking-tighter tabular-nums ${
          className ?? ""
        }`}
      >
        {value}
      </span>
    </Card>
  );
}

export default function GapsPage() {
  const [data, setData] = useState<GapSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGapSummary()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[23px] font-semibold tracking-tight">갭 분석</h1>
        <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
          고시·훈령이 위임했지만 가이드라인이 미발행이거나 갱신되지 않은 항목을 추적합니다.
        </p>
      </div>

      {error && (
        <Card className="gap-0 space-y-2 px-4 py-5">
          <p className="text-sm text-warning">백엔드 연결 실패: {error}</p>
          <p className="text-xs text-muted-foreground">
            법적 근거 데이터가 수집되면 갭 분석 결과가 여기에 표시됩니다.
          </p>
        </Card>
      )}

      {!data && !error && (
        <Card className="gap-0 px-4 py-11 text-center text-sm text-muted-foreground">
          불러오는 중…
        </Card>
      )}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="전체 위임 항목" value={data.total_mandates} />
            <Tile label="미발행" value={data.missing} className="text-destructive" />
            <Tile label="미갱신" value={data.outdated} className="text-warning" />
            <Tile label="해소됨" value={data.resolved} />
          </div>

          {data.gaps.length > 0 ? (
            <Card className="gap-0 overflow-hidden">
              {/* table-fixed: 긴 위임 내용이 날짜·갭 열을 침범하지 않게 한다 */}
              <table className="w-full table-fixed border-collapse text-[13px]">
                <thead>
                  <tr className="text-[11.5px] text-faint">
                    <th className="w-[86px] border-b px-3.5 py-2.5 text-left font-medium">
                      상태
                    </th>
                    <th className="w-[240px] border-b px-3.5 py-2.5 text-left font-medium">
                      법적 근거
                    </th>
                    <th className="border-b px-3.5 py-2.5 text-left font-medium">
                      위임 내용
                    </th>
                    <th className="w-[104px] border-b px-3.5 py-2.5 text-right font-medium">
                      근거 개정일
                    </th>
                    <th className="w-[112px] border-b px-3.5 py-2.5 text-right font-medium">
                      가이드라인 갱신일
                    </th>
                    <th className="w-[72px] border-b px-3.5 py-2.5 text-right font-medium">
                      갭(일)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.gaps.map((gap) => (
                    <tr
                      key={gap.id}
                      className="transition-colors last:[&>td]:border-b-0 hover:bg-muted"
                    >
                      <td className="border-b px-3.5 py-2">{gapStatus(gap.status)}</td>
                      <td className="border-b px-3.5 py-2 font-medium break-words">
                        {gap.legal_basis_title}
                      </td>
                      <td className="border-b px-3.5 py-2 break-words text-muted-foreground">
                        {gap.mandate_description}
                      </td>
                      <td className="border-b px-3.5 py-2 text-right text-xs text-muted-foreground tabular-nums">
                        {gap.basis_last_amended || "-"}
                      </td>
                      <td className="border-b px-3.5 py-2 text-right text-xs text-muted-foreground tabular-nums">
                        {gap.guideline_last_updated || "-"}
                      </td>
                      <td className="border-b px-3.5 py-2 text-right tabular-nums">
                        {gap.days_gap != null ? (
                          <span
                            className={
                              gap.days_gap > 365 ? "font-semibold text-destructive" : ""
                            }
                          >
                            {gap.days_gap}
                          </span>
                        ) : (
                          <span className="text-faint">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card className="gap-0 space-y-1.5 px-4 py-11 text-center">
              <p className="font-medium">갭 분석 데이터가 없습니다</p>
              <p className="text-sm text-muted-foreground">
                법적 근거와 위임 항목이 등록되면 자동으로 분석됩니다.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
