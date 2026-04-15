"use client";

import { useEffect, useMemo, useState } from "react";
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
import { fetchRecentChanges, type RecentChange } from "@/lib/api";

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

const PERIOD_OPTIONS = [
  { value: 7, label: "최근 7일" },
  { value: 30, label: "최근 30일" },
  { value: 90, label: "최근 90일" },
  { value: 365, label: "최근 1년" },
];

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function VersionsPage() {
  const [changes, setChanges] = useState<RecentChange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(90);
  const [agencyFilter, setAgencyFilter] = useState<string>("");

  useEffect(() => {
    fetchRecentChanges({ days, limit: 200 })
      .then(setChanges)
      .catch((e) => setError(e.message));
  }, [days]);

  const agencies = useMemo(() => {
    const set = new Map<string, string>();
    for (const c of changes) {
      set.set(c.agency_code, c.agency_name);
    }
    return Array.from(set.entries());
  }, [changes]);

  const filtered = useMemo(() => {
    if (!agencyFilter) return changes;
    return changes.filter((c) => c.agency_code === agencyFilter);
  }, [changes, agencyFilter]);

  const stats = useMemo(() => {
    const newCount = filtered.filter((c) => c.change_type === "new").length;
    const updatedCount = filtered.filter((c) => c.change_type === "updated").length;
    return { newCount, updatedCount, total: filtered.length };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">변경 이력</h1>
        <p className="mt-2 text-muted-foreground">
          최근 신규 등록 또는 개정된 가이드라인을 추적합니다.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-amber-600">
            백엔드 연결 실패: {error}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 변경</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>신규 등록</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.newCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>버전 갱신</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{stats.updatedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">기간:</span>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                days === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">기관:</span>
          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">전체</option>
            {agencies.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length}건
        </span>
      </div>

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">유형</TableHead>
                <TableHead>제목</TableHead>
                <TableHead className="w-[80px]">기관</TableHead>
                <TableHead className="w-[80px]">분야</TableHead>
                <TableHead className="w-[100px]">게시일</TableHead>
                <TableHead className="w-[80px]">감지</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => (
                <TableRow key={`${item.guideline_id}-${i}`}>
                  <TableCell>
                    {item.change_type === "new" ? (
                      <Badge className="bg-blue-500 text-white">신규</Badge>
                    ) : (
                      <Badge className="bg-emerald-500 text-white">갱신</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[400px]">
                    <div className="truncate">{item.title}</div>
                    {item.version_label && (
                      <span className="text-xs text-muted-foreground">
                        {item.version_label}
                      </span>
                    )}
                    {item.version_count > 1 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({item.version_count}개 버전)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{item.agency_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABEL[item.category] || item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {formatDate(item.published_date)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {timeAgo(item.detected_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!error && filtered.length === 0 && changes.length > 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            선택한 기간/기관에 해당하는 변경 이력이 없습니다.
          </CardContent>
        </Card>
      )}

      {!error && changes.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground space-y-2">
            <p className="text-lg font-medium">변경 이력이 없습니다</p>
            <p>크롤링이 실행되면 신규/갱신 가이드라인이 여기에 표시됩니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
