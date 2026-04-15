"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchLegalBases, type LegalBasis } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  gosi: "고시",
  hunryeong: "훈령",
  yegyu: "예규",
  gojung: "고정",
};

export default function LegalBasesPage() {
  const [bases, setBases] = useState<LegalBasis[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLegalBases()
      .then(setBases)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">법적 근거</h1>
        <p className="mt-2 text-muted-foreground">
          가이드라인 발행의 법적 근거가 되는 고시/훈령/예규 목록입니다.
          법제처 행정규칙 API로 수집됩니다.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-amber-600">
            백엔드 연결 실패: {error}
          </CardContent>
        </Card>
      )}

      {!error && bases.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground space-y-2">
            <p className="text-lg font-medium">아직 등록된 법적 근거가 없습니다</p>
            <p>
              법제처 행정규칙 API 연동 후 고시/훈령이 자동으로 수집됩니다.
              수집된 고시/훈령에서 &quot;~가이드라인을 정하여 고시한다&quot; 같은 위임 조항을 추출하여
              가이드라인 매핑에 활용합니다.
            </p>
          </CardContent>
        </Card>
      )}

      {bases.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>유형</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>모법</TableHead>
              <TableHead>공포일</TableHead>
              <TableHead>위임 항목</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bases.map((basis) => (
              <TableRow key={basis.id}>
                <TableCell>
                  <Badge variant="outline">
                    {TYPE_LABEL[basis.basis_type] || basis.basis_type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium max-w-[400px]">{basis.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {basis.parent_law_name || "-"}
                </TableCell>
                <TableCell>{basis.promulgation_date || "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{basis.mandate_count}건</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
