"use client";

import { useEffect, useState } from "react";

import { fetchKeywordMeta, type ItemType, type KeywordMeta } from "@/lib/api";

/**
 * 수집 키워드 안내 툴팁 — (?) 아이콘.
 *
 * 사용자가 어떤 기준으로 정보가 수집되는지 투명하게 확인할 수 있도록
 * 백엔드 /meta/keywords 의 키워드 목록을 그대로 보여준다.
 * 조회에 실패하면 키워드를 지어내지 않고 실패했다는 사실만 밝힌다.
 */
export function KeywordInfo({ itemType }: { itemType: ItemType }) {
  const [data, setData] = useState<KeywordMeta | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchKeywordMeta(itemType)
      .then((d) => setData(d))
      .catch(() => setFailed(true));
  }, [itemType]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="grid size-5 place-items-center rounded-full border text-[11px] font-semibold text-muted-foreground transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
        aria-label="수집 기준 안내"
        aria-expanded={open}
        title="수집 기준"
      >
        ?
      </button>

      {open && (
        <div className="absolute top-7 left-0 z-50 w-80 rounded-xl bg-card p-3.5 text-sm shadow-lg ring-1 ring-foreground/10">
          {data ? (
            <>
              <p className="text-[13px] font-semibold">
                수집 키워드 {data.keywords.length}개
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{data.description}</p>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {data.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-[5px] bg-muted px-1.5 py-0.5 text-[11px] text-foreground"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 border-t pt-2 text-[11px] text-faint">
                제목에 이 키워드 중 하나라도 포함되면 수집 대상.
              </p>
            </>
          ) : failed ? (
            <p className="text-xs text-warning">
              수집 키워드를 불러오지 못했습니다. 백엔드 연결을 확인해 주세요.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">불러오는 중…</p>
          )}
        </div>
      )}
    </div>
  );
}
