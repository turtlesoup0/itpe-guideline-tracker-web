"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
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
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[23px] font-semibold tracking-tight">법적 근거</h1>
          <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
            가이드라인 발행의 근거가 되는 고시·훈령·예규 목록입니다. 법제처 행정규칙
            API로 수집됩니다.
          </p>
        </div>
        {bases.length > 0 && (
          <span className="pb-1 text-xs text-muted-foreground tabular-nums">
            {bases.length}건
          </span>
        )}
      </div>

      {error && (
        <Card className="gap-0 px-4 py-5 text-sm text-warning">
          백엔드 연결 실패: {error}
        </Card>
      )}

      {!error && bases.length === 0 && (
        <Card className="gap-0 space-y-1.5 px-4 py-11 text-center">
          <p className="font-medium">아직 등록된 법적 근거가 없습니다</p>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            법제처 행정규칙 API 연동 후 고시·훈령이 자동으로 수집됩니다. 수집된
            고시·훈령에서 위임 조항을 추출해 가이드라인 매핑에 활용합니다.
          </p>
        </Card>
      )}

      {bases.length > 0 && (
        <Card className="gap-0 overflow-hidden">
          {/* table-fixed: 긴 제목이 공포일·위임 항목 열을 침범하지 않게 한다 */}
          <table className="w-full table-fixed border-collapse text-[13px]">
            <thead>
              <tr className="text-[11.5px] text-faint">
                <th className="w-[62px] border-b px-3.5 py-2.5 text-left font-medium">
                  유형
                </th>
                <th className="border-b px-3.5 py-2.5 text-left font-medium">제목</th>
                <th className="w-[200px] border-b px-3.5 py-2.5 text-left font-medium">
                  모법
                </th>
                <th className="w-[100px] border-b px-3.5 py-2.5 text-right font-medium">
                  공포일
                </th>
                <th className="w-[86px] border-b px-3.5 py-2.5 text-right font-medium">
                  위임 항목
                </th>
              </tr>
            </thead>
            <tbody>
              {bases.map((basis) => (
                <tr
                  key={basis.id}
                  className="transition-colors last:[&>td]:border-b-0 hover:bg-muted"
                >
                  <td className="border-b px-3.5 py-2">
                    <Tag>{TYPE_LABEL[basis.basis_type] || basis.basis_type}</Tag>
                  </td>
                  <td className="border-b px-3.5 py-2 font-medium break-words">
                    {basis.title}
                  </td>
                  <td className="border-b px-3.5 py-2 text-xs break-words text-muted-foreground">
                    {basis.parent_law_name || "-"}
                  </td>
                  <td className="border-b px-3.5 py-2 text-right text-xs text-muted-foreground tabular-nums">
                    {basis.promulgation_date || "-"}
                  </td>
                  <td className="border-b px-3.5 py-2 text-right tabular-nums">
                    {basis.mandate_count}건
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
