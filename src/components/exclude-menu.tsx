"use client";

import { useEffect, useRef, useState } from "react";

import { excludeGuideline, type ExclusionCategory } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * 수집 제외 사유는 자유 텍스트가 아니라 고정 분류로 받는다.
 * 주기 분석이 사유별로 집계해 "무엇이 왜 새어 들어오는지"를 근거로
 * 필터 규칙 후보를 뽑기 때문 — 표현이 제각각이면 집계가 안 된다.
 */
export const EXCLUSION_CATEGORY: { value: ExclusionCategory; label: string; hint: string }[] = [
  { value: "physical_security", label: "물리·시설 보안", hint: "청사 출입, 방호" },
  { value: "intl_agreement", label: "국제협정·MOU", hint: "상호인정, 업무협약" },
  { value: "education_promo", label: "교육·홍보·행사", hint: "교재, 세미나" },
  { value: "plan_report", label: "계획·실적", hint: "추진계획, 결과보고" },
  { value: "non_it", label: "비IT 행정", hint: "인사, 회계 등" },
  { value: "duplicate", label: "중복 수집", hint: "같은 문서 재등록" },
  { value: "other", label: "기타", hint: "사유 메모 필수" },
];

export const EXCLUSION_LABEL: Record<string, string> = Object.fromEntries(
  EXCLUSION_CATEGORY.map((c) => [c.value, c.label]),
);

export function ExcludeMenu({
  guidelineId,
  onExcluded,
}: {
  guidelineId: number;
  onExcluded: (info: { id: number; category: ExclusionCategory }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<ExclusionCategory | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function reset() {
    setPicked(null);
    setNote("");
    setError(null);
  }

  async function submit(category: ExclusionCategory, memo: string) {
    setBusy(true);
    setError(null);
    try {
      await excludeGuideline(guidelineId, {
        category,
        note: memo.trim() || undefined,
      });
      setOpen(false);
      reset();
      onExcluded({ id: guidelineId, category });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function pick(category: ExclusionCategory) {
    // '기타'는 메모가 있어야 분석에 쓸 수 있으므로 입력을 받고 나서 전송
    if (category === "other") {
      setPicked(category);
      return;
    }
    void submit(category, "");
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          reset();
        }}
        title="추적 제외"
        aria-label="추적 제외"
        aria-expanded={open}
        className={cn(
          "grid size-6 place-items-center rounded-md text-faint transition-colors",
          "hover:bg-muted hover:text-warning",
          open && "bg-muted text-warning",
        )}
      >
        <svg
          className="size-[13px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M6 18L18 6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-64 rounded-xl bg-card p-1.5 text-left shadow-lg ring-1 ring-foreground/10">
          {picked === "other" ? (
            <div className="space-y-2 p-1.5">
              <p className="text-xs font-medium">제외 사유를 적어주세요</p>
              <textarea
                autoFocus
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 특정 기관 내부 운영문서"
                className="w-full resize-none rounded-lg border bg-card px-2 py-1.5 text-xs outline-none placeholder:text-faint focus:border-primary focus:ring-3 focus:ring-primary-soft"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={busy || !note.trim()}
                  onClick={() => void submit("other", note)}
                  className="h-7 flex-1 rounded-lg bg-primary text-xs font-medium text-primary-foreground disabled:opacity-50"
                >
                  제외
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="h-7 rounded-lg border px-2.5 text-xs text-muted-foreground"
                >
                  뒤로
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="px-2 pt-1 pb-1.5 text-[11px] text-faint">
                왜 추적이 불필요한가요?
              </p>
              {EXCLUSION_CATEGORY.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  disabled={busy}
                  onClick={() => pick(c.value)}
                  className="flex w-full items-baseline gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="text-[11px] text-faint">{c.hint}</span>
                </button>
              ))}
            </>
          )}

          {error && (
            <p className="px-2 py-1.5 text-[11px] text-warning">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
