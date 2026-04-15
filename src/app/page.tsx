import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * 대시보드 메인 페이지.
 *
 * 백엔드 연동 전까지 정적 데이터로 레이아웃을 잡습니다.
 * 추후 fetchAgencies(), fetchGapSummary(), fetchCrawlStatus()로 동적 전환.
 */

const AGENCIES = [
  { code: "PIPC", name: "개인정보보호위원회", short: "개인정보위", targets: 2 },
  { code: "MSIT", name: "과학기술정보통신부", short: "과기정통부", targets: 1 },
  { code: "KISA", name: "한국인터넷진흥원", short: "KISA", targets: 2 },
  { code: "NIS", name: "국가사이버안보센터", short: "NCSC", targets: 1 },
  { code: "FSC", name: "금융위원회", short: "금융위", targets: 3 },
  { code: "NIA", name: "한국지능정보사회진흥원", short: "NIA", targets: 1 },
  { code: "MOIS", name: "행정안전부", short: "행안부", targets: 2 },
  { code: "SPRI", name: "소프트웨어정책연구소", short: "SPRi", targets: 1 },
  { code: "KCC", name: "방송통신위원회", short: "방통위", targets: 1 },
];

const STATS = [
  { label: "추적 기관", value: "9", description: "정부/공공기관" },
  { label: "크롤링 타겟", value: "14", description: "RSS + BBS + API" },
  { label: "수집 가이드라인", value: "-", description: "DB 연동 후 표시" },
  { label: "갭 항목", value: "-", description: "법적 근거 대비 미발행" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="mt-2 text-muted-foreground">
          정보보안 / 개인정보 / SW 관련 가이드라인의 발행 현황과 갭을 한눈에 파악합니다.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Agency Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">추적 대상 기관</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENCIES.map((agency) => (
            <Card key={agency.code} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{agency.short}</CardTitle>
                  <Badge variant="secondary">{agency.code}</Badge>
                </div>
                <CardDescription className="text-xs">{agency.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">크롤링 타겟</span>
                  <span className="font-medium">{agency.targets}개</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">최근 크롤링</span>
                  <span className="text-xs text-muted-foreground">미실행</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Architecture Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">시스템 아키텍처</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>2계층 추적:</strong> 고시/훈령(법적 근거) &rarr; 위임 항목 매핑 &rarr;
            실제 발행 가이드라인 추적 &rarr; 갭 분석
          </p>
          <p>
            <strong>데이터 수집:</strong> RSS 피드(행안부, 금융위, KISA) + BBS 스크래핑(PIPC, KCC) +
            법제처 API(MSIT 고시/훈령)
          </p>
          <p>
            <strong>주기:</strong> 일간(RSS), 주간(BBS/법제처), 월간(NIS/NIA/SPRi)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
