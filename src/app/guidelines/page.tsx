"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchGuidelines, fetchAgencies, type Guideline, type Agency } from "@/lib/api";

const CATEGORY_LABEL: Record<string, string> = {
  info_security: "정보보안",
  privacy: "개인정보",
  software: "소프트웨어",
  data: "데이터",
  cloud: "클라우드",
  ai: "인공지능",
  e_gov: "전자정부",
  finance: "금융보안",
  other: "기타",
};

export default function GuidelinesPage() {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchGuidelines(), fetchAgencies()])
      .then(([gl, ag]) => {
        setGuidelines(gl);
        setAgencies(ag);
      })
      .catch((e) => setError(e.message));
  }, []);

  const agencyMap = Object.fromEntries(agencies.map((a) => [a.id, a]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">가이드라인</h1>
        <p className="mt-2 text-muted-foreground">
          수집된 가이드라인 목록입니다. 크롤링 결과가 DB에 저장되면 여기에 표시됩니다.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-amber-600">
            백엔드 연결 실패: {error}
          </CardContent>
        </Card>
      )}

      {!error && guidelines.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground space-y-2">
            <p className="text-lg font-medium">아직 등록된 가이드라인이 없습니다</p>
            <p>
              크롤링으로 수집된 항목이 가이드라인으로 등록되면 여기에 표시됩니다.
              현재 파이프라인: 크롤링 &rarr; 항목 수집 &rarr; 가이드라인 매칭 &rarr; DB 저장
            </p>
          </CardContent>
        </Card>
      )}

      {guidelines.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>분야</TableHead>
              <TableHead>발행기관</TableHead>
              <TableHead>법적 근거</TableHead>
              <TableHead>링크</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guidelines.map((gl) => (
              <TableRow key={gl.id}>
                <TableCell className="font-medium max-w-[400px]">{gl.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {CATEGORY_LABEL[gl.category] || gl.category}
                  </Badge>
                </TableCell>
                <TableCell>{agencyMap[gl.agency_id]?.short_name || "-"}</TableCell>
                <TableCell>
                  {gl.mandate_id ? (
                    <Badge className="bg-emerald-500 text-white">매칭됨</Badge>
                  ) : (
                    <Badge variant="secondary">미매칭</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {gl.source_url && (
                    <a
                      href={gl.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      원문
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
