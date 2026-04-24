"use client";

import { useEffect, useState } from "react";

interface KeywordMeta {
  description: string;
  keywords: string[];
}

interface KeywordResponse {
  guideline: KeywordMeta;
  announcement: KeywordMeta;
}

/**
 * 수집 키워드 안내 툴팁 — (?) 아이콘.
 *
 * 사용자가 어떤 기준으로 정보가 수집되는지 투명하게 확인할 수 있도록
 * 백엔드 /meta/keywords에서 키워드 목록을 가져와 표시.
 */
export function KeywordInfo({ itemType }: { itemType: "guideline" | "announcement" }) {
  const [data, setData] = useState<KeywordMeta | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API_BASE}/meta/keywords`)
      .then((r) => r.json() as Promise<KeywordResponse>)
      .then((d) => setData(d[itemType]))
      .catch(() => {
        // 실패 시 하드코딩 fallback
        setData({
          description:
            itemType === "guideline"
              ? "가이드라인/안내서/매뉴얼 관련 키워드"
              : "보도자료 중 가이드라인·법령 발표성 글만 필터링",
          keywords: [],
        });
      });
  }, [itemType]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-muted-foreground/40 text-muted-foreground hover:bg-muted hover:text-foreground text-xs font-semibold transition-colors"
        aria-label="수집 기준 안내"
        title="수집 기준"
      >
        ?
      </button>

      {open && data && (
        <div className="absolute left-0 top-7 z-50 w-80 rounded-lg border bg-background p-3 shadow-lg text-sm">
          <p className="font-medium mb-1">수집 키워드 ({data.keywords.length}개)</p>
          <p className="text-xs text-muted-foreground mb-2">{data.description}</p>
          <div className="flex flex-wrap gap-1">
            {data.keywords.map((kw) => (
              <span
                key={kw}
                className="text-xs px-1.5 py-0.5 bg-muted rounded text-foreground"
              >
                {kw}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t">
            제목에 이 키워드 중 하나라도 포함되면 수집 대상.
            <br />
            기준 변경은 백엔드 <code className="text-[10px]">registry.py</code>에서 관리.
          </p>
        </div>
      )}
    </div>
  );
}
