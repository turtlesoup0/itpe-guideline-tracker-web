"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/category-dot";
import { Tag } from "@/components/ui/tag";
import { EXCLUSION_LABEL } from "@/components/exclude-menu";
import {
  fetchExclusionAnalysis,
  fetchGuidelines,
  restoreGuideline,
  reviewRuleCandidate,
  type ExclusionAnalysis,
  type Guideline,
} from "@/lib/api";

function formatYearMonth(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ExcludedPage() {
  const [items, setItems] = useState<Guideline[]>([]);
  const [analysis, setAnalysis] = useState<ExclusionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    Promise.all([fetchGuidelines({ excluded: true }), fetchExclusionAnalysis()])
      .then(([list, meta]) => {
        setItems(list);
        setAnalysis(meta);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  async function restore(id: number) {
    setBusy(id);
    try {
      await restoreGuideline(id);
      setItems((prev) => prev.filter((g) => g.id !== id));
      setAnalysis(await fetchExclusionAnalysis());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function review(id: number, approve: boolean) {
    setBusy(id);
    try {
      await reviewRuleCandidate(id, approve);
      setAnalysis(await fetchExclusionAnalysis());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[23px] font-semibold tracking-tight">제외함</h1>
          <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
            추적이 불필요하다고 표시한 항목입니다. 목록·대시보드에서 숨겨지고 다음
            크롤링에서도 다시 수집되지 않습니다. 데이터는 남아 있어 언제든 복구할 수
            있습니다.
          </p>
        </div>
        <span className="pb-1 text-xs text-muted-foreground tabular-nums">
          {items.length}건
        </span>
      </div>

      {error && (
        <Card className="gap-0 px-4 py-5 text-sm text-warning">{error}</Card>
      )}

      {/* 사유 분포 */}
      {analysis && analysis.excluded_count > 0 && (
        <Card className="flex flex-row flex-wrap items-center gap-2 gap-0 px-4 py-3">
          <span className="mr-1 text-[11.5px] text-faint">사유</span>
          {Object.entries(analysis.by_category)
            .sort(([, a], [, b]) => b - a)
            .map(([key, count]) => (
              <span
                key={key}
                className="inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-xs text-muted-foreground"
              >
                {EXCLUSION_LABEL[key] ?? key}
                <span className="text-[11.5px] text-faint tabular-nums">{count}</span>
              </span>
            ))}
        </Card>
      )}

      {/* 제외된 항목 */}
      {items.length === 0 ? (
        <Card className="gap-0 space-y-1.5 px-4 py-11 text-center">
          <p className="font-medium">제외된 항목이 없습니다</p>
          <p className="text-sm text-muted-foreground">
            가이드라인 목록의 ⊘ 버튼으로 추적 불필요 항목을 표시할 수 있습니다.
          </p>
        </Card>
      ) : (
        <Card className="gap-0 overflow-hidden">
          <table className="w-full table-fixed border-collapse text-[13px]">
            <thead>
              <tr className="text-[11.5px] text-faint">
                <th className="border-b px-3.5 py-2.5 text-left font-medium">제목</th>
                <th className="w-[104px] border-b px-3.5 py-2.5 text-left font-medium">
                  분야
                </th>
                <th className="w-[124px] border-b px-3.5 py-2.5 text-left font-medium">
                  제외 사유
                </th>
                <th className="w-[86px] border-b px-3.5 py-2.5 text-right font-medium">
                  게시일
                </th>
                <th className="w-[78px] border-b px-3.5 py-2.5 text-center font-medium">
                  복구
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((g) => (
                <tr key={g.id} className="transition-colors last:[&>td]:border-b-0 hover:bg-muted">
                  <td className="border-b px-3.5 py-2 break-words">
                    <span className="font-medium">{g.title}</span>
                    {g.exclusion_note && (
                      <span className="mt-0.5 block text-xs text-faint">
                        {g.exclusion_note}
                      </span>
                    )}
                  </td>
                  <td className="border-b px-3.5 py-2">
                    <CategoryTag category={g.category} />
                  </td>
                  <td className="border-b px-3.5 py-2">
                    {g.exclusion_category && (
                      <Tag>{EXCLUSION_LABEL[g.exclusion_category] ?? g.exclusion_category}</Tag>
                    )}
                  </td>
                  <td className="border-b px-3.5 py-2 text-right text-xs text-muted-foreground tabular-nums">
                    {formatYearMonth(g.latest_published_date)}
                  </td>
                  <td className="border-b px-3.5 py-2 text-center">
                    <button
                      type="button"
                      disabled={busy === g.id}
                      onClick={() => void restore(g.id)}
                      className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      복구
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* 규칙 후보 */}
      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-muted-foreground">
          필터 규칙 후보
        </h2>

        {analysis && analysis.candidates.length > 0 ? (
          <Card className="gap-0 overflow-hidden">
            <table className="w-full table-fixed border-collapse text-[13px]">
              <thead>
                <tr className="text-[11.5px] text-faint">
                  <th className="w-[160px] border-b px-3.5 py-2.5 text-left font-medium">
                    패턴
                  </th>
                  <th className="border-b px-3.5 py-2.5 text-left font-medium">
                    근거 제목
                  </th>
                  <th className="w-[72px] border-b px-3.5 py-2.5 text-right font-medium">
                    근거
                  </th>
                  <th className="w-[72px] border-b px-3.5 py-2.5 text-right font-medium">
                    오탐
                  </th>
                  <th className="w-[112px] border-b px-3.5 py-2.5 text-center font-medium">
                    검토
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysis.candidates.map((c) => (
                  <tr key={c.id} className="last:[&>td]:border-b-0">
                    <td className="border-b px-3.5 py-2 font-mono text-xs break-words">
                      {c.pattern}
                    </td>
                    <td className="border-b px-3.5 py-2 text-xs break-words text-muted-foreground">
                      {c.sample_titles.slice(0, 2).map((t) => (
                        <span key={t} className="block truncate">
                          {t}
                        </span>
                      ))}
                    </td>
                    <td className="border-b px-3.5 py-2 text-right font-medium tabular-nums">
                      {c.support_count}
                    </td>
                    <td className="border-b px-3.5 py-2 text-right tabular-nums">
                      {c.false_positive_count > 0 ? (
                        <span className="font-semibold text-destructive">
                          {c.false_positive_count}
                        </span>
                      ) : (
                        <span className="text-faint">0</span>
                      )}
                    </td>
                    <td className="border-b px-3.5 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          disabled={busy === c.id || c.false_positive_count > 0}
                          onClick={() => void review(c.id, true)}
                          className="text-xs font-medium text-primary hover:underline disabled:opacity-40"
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          disabled={busy === c.id}
                          onClick={() => void review(c.id, false)}
                          className="text-xs text-muted-foreground hover:underline disabled:opacity-40"
                        >
                          반려
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="gap-0 space-y-1.5 px-4 py-8 text-center">
            <p className="text-sm font-medium">아직 제안할 규칙이 없습니다</p>
            <p className="mx-auto max-w-2xl text-xs text-muted-foreground">
              같은 신호가 제외 항목 2건 이상에서 반복되고, 살아있는 항목에는 한 번도
              걸리지 않아야 후보가 됩니다. 사례가 하나뿐이면 규칙이 아니라 그 항목
              자체이므로 제안하지 않습니다.
            </p>
          </Card>
        )}

        {analysis?.note && (
          <p className="mt-2 text-[11.5px] text-faint">{analysis.note}</p>
        )}
      </section>
    </div>
  );
}
