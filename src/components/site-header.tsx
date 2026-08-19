"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MobileNav } from "@/app/mobile-nav";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "대시보드" },
  { href: "/guidelines", label: "가이드라인" },
  { href: "/announcements", label: "보도·발표" },
  { href: "/versions", label: "변경 이력" },
  { href: "/agencies", label: "추적 기관" },
];

function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Safari 프라이빗 모드 등 localStorage 미허용 환경 — 세션 한정으로 동작
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="테마 전환"
      aria-label="테마 전환"
      className="grid size-8 place-items-center rounded-lg border bg-card text-muted-foreground transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
    >
      <svg
        className="size-[15px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17V3.5z" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:gap-7">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-[22px] place-items-center rounded-md bg-primary text-primary-foreground">
            <svg
              className="size-[13px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.1}
              strokeLinejoin="round"
            >
              <path d="M12 3l8.5 4.6-8.5 4.6-8.5-4.6L12 3z" />
              <path d="M3.5 12.4l8.5 4.6 8.5-4.6" />
            </svg>
          </span>
          <span className="truncate text-[14.5px] font-semibold tracking-tight">
            IT 가이드라인 트래커
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[13px] whitespace-nowrap transition-colors",
                isActive(item.href)
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="sm:hidden">
            <MobileNav items={NAV_ITEMS} />
          </div>
        </div>
      </div>
    </header>
  );
}
