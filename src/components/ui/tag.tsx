import { cn } from "@/lib/utils";

/**
 * 목록·표 안에 들어가는 작은 표식들.
 * shadcn Badge(알약, h-5)와 달리 사각에 가까운 5px 라운드 + 18px 높이로,
 * 행 높이를 밀어 올리지 않고 제목 옆에 붙는다.
 */

const TAG_TONE = {
  muted: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  warning: "border border-warning/35 text-warning",
} as const;

export function Tag({
  tone = "muted",
  className,
  children,
}: {
  tone?: keyof typeof TAG_TONE;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center gap-1 rounded-[5px] px-1.5 text-[11px] font-medium whitespace-nowrap",
        TAG_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 기관 코드처럼 짧은 식별자 */
export function CodeChip({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] border bg-muted px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE = {
  ok: "bg-success",
  warn: "bg-warning",
  danger: "bg-destructive",
  idle: "bg-border-strong",
} as const;

/** 상태는 색 배지가 아니라 점 + 텍스트 */
export function StatusDot({
  tone,
  className,
  children,
}: {
  tone: keyof typeof STATUS_TONE;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("inline-block size-1.5 shrink-0 rounded-full", STATUS_TONE[tone])}
      />
      {children}
    </span>
  );
}
