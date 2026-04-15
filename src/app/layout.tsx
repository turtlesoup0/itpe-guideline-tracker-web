import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IT 가이드라인 트래커",
  description: "정보보안/개인정보/SW 가이드라인 개정 추적 시스템",
};

const NAV_ITEMS = [
  { href: "/", label: "대시보드" },
  { href: "/agencies", label: "추적 기관" },
  { href: "/guidelines", label: "가이드라인" },
  { href: "/legal-bases", label: "법적 근거" },
  { href: "/gaps", label: "갭 분석" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
            <Link href="/" className="mr-8 font-bold text-lg">
              IT 가이드라인 트래커
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t py-4">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground">
            IT 가이드라인 트래커 &mdash; 정보보안 / 개인정보 / SW 가이드라인 개정 추적
          </div>
        </footer>
      </body>
    </html>
  );
}
