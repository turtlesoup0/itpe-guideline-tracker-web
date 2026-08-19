import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

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

// 첫 페인트 전에 테마 클래스를 확정해 라이트→다크 깜빡임을 막는다.
// body 최상단에서 동기 실행되므로 헤더가 그려지기 전에 끝난다.
const THEME_INIT = `try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />

        <SiteHeader />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-7">
          {children}
        </main>

        <footer className="border-t py-4">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-faint">
            IT 가이드라인 트래커 &mdash; 정보보안 / 개인정보 / SW 가이드라인 개정 추적
          </div>
        </footer>
      </body>
    </html>
  );
}
