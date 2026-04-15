"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { fetchGapSummary, type GapSummary } from "@/lib/api";

function statusBadge(status: string) {
  if (status === "missing") return <Badge variant="destructive">미발행</Badge>;
  if (status === "outdated") return <Badge className="bg-amber-500 text-white">미갱신</Badge>;
  if (status === "resolved") return <Badge className="bg-emerald-500 text-white">해소</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">갭 분석</h1>
        <p className="mt-2 text-muted-foreground">
          법적 근거(고시/훈령)에서 위임했지만 가이드라인이 미발행되었거나 미갱신된 항목을 추적합니다.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-amber-600">
              백엔드 연결 실패: {error}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              법적 근거 데이터가 수집되면 갭 분석 결과가 여기에 표시됩니다.
              현재는 고시/훈령 → 위임 항목 매핑이 진행 중입니다.
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>전체 위임 항목</CardDescription>
                <CardTitle className="text-3xl">{data.total_mandates}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>미발행</CardDescription>
                <CardTitle className="text-3xl text-red-600">{data.missing}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>미갱신</CardDescription>
                <CardTitle className="text-3xl text-amber-600">{data.outdated}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>해소됨</CardDescription>
                <CardTitle className="text-3xl text-emerald-600">{data.resolved}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Separator />

          {/* Gap table */}
          {data.gaps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상태</TableHead>
                  <TableHead>법적 근거</TableHead>
                  <TableHead>위임 내용</TableHead>
                  <TableHead>근거 개정일</TableHead>
                  <TableHead>가이드라인 갱신일</TableHead>
                  <TableHead>갭(일)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.gaps.map((gap) => (
                  <TableRow key={gap.id}>
                    <TableCell>{statusBadge(gap.status)}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {gap.legal_basis_title}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {gap.mandate_description}
                    </TableCell>
                    <TableCell>{gap.basis_last_amended || "-"}</TableCell>
                    <TableCell>{gap.guideline_last_updated || "-"}</TableCell>
                    <TableCell>
                      {gap.days_gap != null ? (
                        <span className={gap.days_gap > 365 ? "text-red-600 font-bold" : ""}>
                          {gap.days_gap}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                현재 갭 분석 데이터가 없습니다.
                법적 근거와 위임 항목이 등록되면 자동으로 분석됩니다.
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!data && !error && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            데이터를 불러오는 중...
          </CardContent>
        </Card>
      )}
    </div>
  );
}
