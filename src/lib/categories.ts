/**
 * 분야(카테고리) 표기의 단일 소스.
 *
 * 이전에는 page.tsx / guidelines / announcements / versions 4곳이 각자
 * 라벨과 Tailwind 색상 클래스를 들고 있어 같은 분야가 화면마다 다른 이름·
 * 다른 색으로 보였다. 라벨과 색은 여기서만 정의한다.
 *
 * 색은 globals.css 의 --cat-* 토큰. 밝기·채도를 고정하고 색상(hue)만
 * 돌려서, 9개가 나란히 놓여도 특정 분야만 튀지 않게 맞춰 두었다.
 */

export type CategoryKey =
  | "info_security"
  | "privacy"
  | "ai"
  | "e_gov"
  | "data"
  | "software"
  | "cloud"
  | "finance"
  | "other";

type CategoryMeta = {
  label: string;
  /** 분야 점 배경색 */
  dot: string;
  /** 분야 색을 텍스트에 쓸 때 (막대그래프 라벨 등 제한적으로) */
  text: string;
};

/** 목록·필터에 노출하는 기본 순서 (수집량 많은 쪽 우선) */
export const CATEGORY_ORDER: CategoryKey[] = [
  "info_security",
  "privacy",
  "ai",
  "e_gov",
  "data",
  "software",
  "cloud",
  "finance",
  "other",
];

export const CATEGORY: Record<CategoryKey, CategoryMeta> = {
  info_security: { label: "정보보안", dot: "bg-cat-infosec", text: "text-cat-infosec" },
  privacy: { label: "개인정보", dot: "bg-cat-privacy", text: "text-cat-privacy" },
  ai: { label: "인공지능", dot: "bg-cat-ai", text: "text-cat-ai" },
  e_gov: { label: "전자정부", dot: "bg-cat-egov", text: "text-cat-egov" },
  data: { label: "데이터", dot: "bg-cat-data", text: "text-cat-data" },
  software: { label: "소프트웨어", dot: "bg-cat-software", text: "text-cat-software" },
  cloud: { label: "클라우드", dot: "bg-cat-cloud", text: "text-cat-cloud" },
  finance: { label: "금융보안", dot: "bg-cat-finance", text: "text-cat-finance" },
  other: { label: "기타", dot: "bg-cat-other", text: "text-cat-other" },
};

function meta(key: string): CategoryMeta | undefined {
  return CATEGORY[key as CategoryKey];
}

/** 미등록 분야 코드는 색을 지어내지 않고 코드 그대로 노출한다. */
export function categoryLabel(key: string): string {
  return meta(key)?.label ?? key;
}

export function categoryDotClass(key: string): string {
  return meta(key)?.dot ?? CATEGORY.other.dot;
}

export function categoryTextClass(key: string): string {
  return meta(key)?.text ?? CATEGORY.other.text;
}
