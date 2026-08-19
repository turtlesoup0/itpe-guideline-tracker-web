"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/category-dot";
import { Tag } from "@/components/ui/tag";
import { categoryLabel } from "@/lib/categories";
import { fetchGuidelineDetail, type GuidelineDetail } from "@/lib/api";

function formatDate(s: string | null): string {
  if (!s) return "-";
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function daysBetween(later: string | null, earlier: string | null): number | null {
  if (!later || !earlier) return null;
  const diff = new Date(later).getTime() - new Date(earlier).getTime();
  if (Number.isNaN(diff)) return null;
  return Math.round(diff / 86400000);
}

function ExternalIcon() {
  return (
    <svg
      className="size-[13px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4h6v6" />
      <path d="M20 4l-8.5 8.5" />
      <path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="size-[13px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5v12" />
      <path d="M7.5 11l4.5 4.5 4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </svg>
  );
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
    return <Card className="gap-0 px-4 py-5 text-sm text-warning">{error}</Card>;
  }
  if (!data) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;

  const versions = [...data.versions].sort((a, b) =>
    (b.published_date || "").localeCompare(a.published_date || ""),
  );
  const first = versions[versions.length - 1];
  const latest = versions[0];

  // 원문에 없는 값(개정 요약·버전 라벨·페이지 수)은 만들어 내지 않는다.
  const hasDetailFields = versions.some(
    (v) => v.change_summary || v.version_label || v.page_count,
  );

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <Link
          href={data.item_type === "announcement" ? "/announcements" : "/guidelines"}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <svg
            className="size-[13px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
          {data.item_type === "announcement" ? "보도·발표" : "가이드라인"}
        </Link>

        <h1 className="mt-2.5 max-w-3xl text-[26px] leading-snug font-semibold tracking-tight text-pretty">
          {data.title}
        </h1>

        {data.description && (
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {data.description}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-muted-foreground">
          <CategoryTag category={data.category} />
          {data.item_type === "announcement" && (
            <>
              <span className="h-3 w-px bg-border-strong" />
              <span>보도·발표</span>
            </>
          )}
          {latest?.published_date && (
            <>
              <span className="h-3 w-px bg-border-strong" />
              <span className="tabular-nums">
                최신 게시일 {formatDate(latest.published_date)}
              </span>
            </>
          )}
          <span className="h-3 w-px bg-border-strong" />
          <span className="tabular-nums">버전 {versions.length}개</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {data.source_url && (
            <a
              href={data.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:border-primary-hover hover:bg-primary-hover"
            >
              <ExternalIcon />
              원문 보기
            </a>
          )}
          {data.pdf_url && (
            <a
              href={data.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs transition-colors hover:border-border-strong hover:bg-muted"
            >
              <DownloadIcon />
              PDF 내려받기
            </a>
          )}
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* 버전 타임라인 */}
        <section>
          <h2 className="mb-2 text-[13px] font-semibold text-muted-foreground">
            버전 이력 {versions.length}개
          </h2>

          {versions.length === 0 ? (
            <Card className="gap-0 px-4 py-8 text-center text-sm text-muted-foreground">
              등록된 버전이 없습니다.
            </Card>
          ) : (
            <div className="flex flex-col">
              {versions.map((v, idx) => {
                const isLatest = idx === 0;
                const gap = daysBetween(
                  v.published_date,
                  versions[idx + 1]?.published_date ?? null,
                );
                return (
                  <div key={v.id} className="flex gap-3.5">
                    <div className="flex w-2.5 shrink-0 flex-col items-center">
                      <span
                        className={
                          isLatest
                            ? "mt-4 size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary-soft"
                            : "mt-4 size-2.5 shrink-0 rounded-full bg-border-strong"
                        }
                      />
                      {idx < versions.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-border" />
                      )}
                    </div>

                    <Card className="mb-2.5 flex-1 gap-0 px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span
                          className={`text-[13.5px] font-medium tabular-nums ${
                            isLatest ? "" : "text-muted-foreground"
                          }`}
                        >
                          {formatDate(v.published_date)}
                        </span>
                        {isLatest && <Tag tone="primary">최신</Tag>}
                        {v.version_label && (
                          <span className="text-xs text-muted-foreground">
                            {v.version_label}
                          </span>
                        )}
                        {gap !== null && gap > 0 && (
                          <span className="text-xs text-faint">{gap}일 후 개정</span>
                        )}
                        {idx === versions.length - 1 && (
                          <span className="text-xs text-faint">최초 수집</span>
                        )}
                        {v.page_count && (
                          <span className="text-xs text-faint">{v.page_count}페이지</span>
                        )}
                        {v.pdf_url && (
                          <a
                            href={v.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover"
                          >
                            PDF
                            <DownloadIcon />
                          </a>
                        )}
                      </div>
                      {v.change_summary && (
                        <p className="mt-2 border-l-2 pl-2.5 text-sm text-muted-foreground">
                          {v.change_summary}
                        </p>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          )}

          {versions.length > 0 && !hasDetailFields && (
            <div className="mt-1 flex gap-2 rounded-[9px] border border-dashed border-border-strong px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <svg
                className="mt-px size-3.5 shrink-0 text-faint"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.9}
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5.5" />
                <path d="M12 7.6v.1" />
              </svg>
              <span>
                원문에 개정 요약·버전 라벨·페이지 수가 없어 표시하지 않습니다. 수집된 값이
                있을 때만 이 자리에 나타납니다.
              </span>
            </div>
          )}
        </section>

        {/* 문서 정보 */}
        <Card className="gap-0 overflow-hidden">
          <div className="border-b px-4 py-3 text-[13px] font-semibold">문서 정보</div>
          <dl className="grid grid-cols-[62px_minmax(0,1fr)] gap-x-3 gap-y-2.5 px-4 py-3.5 text-xs">
            <dt className="text-faint">분야</dt>
            <dd className="m-0">{categoryLabel(data.category)}</dd>

            <dt className="text-faint">유형</dt>
            <dd className="m-0">
              {data.item_type === "announcement" ? "보도·발표" : "가이드라인"}
            </dd>

            <dt className="text-faint">최초 수집</dt>
            <dd className="m-0 tabular-nums">{formatDate(first?.published_date ?? null)}</dd>

            <dt className="text-faint">중복</dt>
            <dd className="m-0">
              {data.duplicate_of_id ? (
                <Link
                  href={`/guidelines/${data.duplicate_of_id}`}
                  className="text-primary hover:text-primary-hover hover:underline"
                >
                  동일 PDF 원본 보기
                </Link>
              ) : (
                <span className="text-muted-foreground">동일 PDF 없음</span>
              )}
            </dd>

            {data.source_url && (
              <>
                <dt className="text-faint">출처</dt>
                <dd className="m-0 break-all">
                  <a
                    href={data.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-hover hover:underline"
                  >
                    {new URL(data.source_url).hostname}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </Card>
      </div>
    </div>
  );
}
