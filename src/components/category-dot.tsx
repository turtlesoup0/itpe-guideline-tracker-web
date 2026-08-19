import { categoryDotClass, categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";

/**
 * 분야 표기는 알약 배경(bg-blue-100 text-blue-800 …) 대신 점 + 라벨.
 * 표 200줄을 훑을 때 배경색이 줄마다 바뀌지 않아야 스캔이 된다.
 */
export function CategoryDot({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-[7px] shrink-0 rounded-[2px]",
        categoryDotClass(category),
        className,
      )}
    />
  );
}

export function CategoryTag({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground",
        className,
      )}
    >
      <CategoryDot category={category} />
      {categoryLabel(category)}
    </span>
  );
}
