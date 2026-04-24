"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchGuidelineDetail, type GuidelineDetail } from "@/lib/api";

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

function formatDate(s: string | null): string {
  if (!s) return "-";
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function GuidelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<GuidelineDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGuidelineDetail(Number(id))
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-amber-600">{error}</CardContent>
      </Card>
    );
  }
  if (!data) return <div className="text-muted-foreground">불러오는 중...</div>;

  const versions = [...data.versions].sort((a, b) =>
    (b.published_date || "").localeCompare(a.published_date || ""),
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <Link
          href={data.item_type === "announcement" ? "/announcements" : "/guidelines"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 목록으로
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">
            {CATEGORY_LABEL[data.category] || data.category}
          </Badge>
          {data.item_type === "announcement" && (
            <Badge variant="secondary">보도·발표</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold mt-2 leading-snug">{data.title}</h1>
        {data.description && (
          <p className="mt-2 text-sm text-muted-foreground">{data.description}</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-sm">
          {data.source_url && (
            <a
              href={data.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              원문 보기 →
            </a>
          )}
          {data.pdf_url && (
            <a
              href={data.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              PDF 다운로드 →
            </a>
          )}
        </div>
      </div>

      {/* 버전 타임라인 */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          버전 이력 ({versions.length}개)
        </h2>
        <div className="space-y-3">
          {versions.map((v, idx) => {
            const isLatest = idx === 0;
            return (
              <div
                key={v.id}
                className={`flex gap-3 ${isLatest ? "" : "opacity-75"}`}
              >
                {/* 타임라인 점/선 */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 ${
                      isLatest ? "bg-blue-500 ring-4 ring-blue-100" : "bg-muted-foreground"
                    }`}
                  />
                  {idx < versions.length - 1 && (
                    <div className="flex-1 w-0.5 bg-muted mt-1" />
                  )}
                </div>

                <Card className="flex-1 mb-1">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-medium tabular-nums">
                          {formatDate(v.published_date)}
                          {isLatest && (
                            <Badge className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0">
                              최신
                            </Badge>
                          )}
                        </p>
                        {v.version_label && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {v.version_label}
                          </p>
                        )}
                      </div>
                      {v.pdf_url && (
                        <a
                          href={v.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline shrink-0"
                        >
                          PDF →
                        </a>
                      )}
                    </div>
                    {v.change_summary && (
                      <p className="mt-2 text-sm text-muted-foreground border-l-2 pl-2 border-slate-200">
                        {v.change_summary}
                      </p>
                    )}
                    {v.page_count && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {v.page_count}페이지
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
