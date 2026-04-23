/**
 * 백엔드 API 클라이언트.
 *
 * FastAPI 백엔드(itpe-guideline-tracker-api)와 통신합니다.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ───────────────────────────────────────────────

export interface Agency {
  id: number;
  code: string;
  name: string;
  short_name: string;
  homepage_url: string;
  description: string | null;
  crawl_configs: CrawlConfig[];
}

export interface CrawlConfig {
  id: number;
  label: string;
  source_type: string;
  schedule: string;
  url: string;
  is_active: boolean;
}

export interface CrawlStatus {
  agency_code: string;
  agency_name: string;
  last_run_at: string | null;
  last_status: string | null;
  last_items_new: number | null;
}

export type ItemType = "guideline" | "announcement";

export interface Guideline {
  id: number;
  agency_id: number;
  mandate_id: number | null;
  title: string;
  category: string;
  item_type: ItemType;
  description: string | null;
  source_url: string | null;
  pdf_url: string | null;
  latest_published_date: string | null;
  version_count: number;
}

export interface LegalBasis {
  id: number;
  agency_id: number;
  basis_type: string;
  title: string;
  promulgation_date: string | null;
  enforcement_date: string | null;
  parent_law_name: string | null;
  category: string;
  mandate_count: number;
}

export interface GapSummary {
  total_mandates: number;
  missing: number;
  outdated: number;
  resolved: number;
  gaps: GapItem[];
}

export interface GapItem {
  id: number;
  mandate_id: number;
  guideline_id: number | null;
  status: string;
  basis_last_amended: string | null;
  guideline_last_updated: string | null;
  days_gap: number | null;
  note: string | null;
  mandate_description: string | null;
  legal_basis_title: string | null;
}

export interface AgencySummary {
  code: string;
  short_name: string;
  name: string;
  homepage_url: string;
  crawl_target_count: number;
  legal_basis_count: number;
  guideline_count: number;
  last_crawl_at: string | null;
  last_crawl_status: string | null;
  last_crawl_items: number | null;
}

export interface RecentLegalBasis {
  id: number;
  title: string;
  basis_type: string;
  agency_name: string;
  promulgation_date: string | null;
  created_at: string | null;
}

export interface RecentChange {
  guideline_id: number;
  title: string;
  agency_code: string;
  agency_name: string;
  category: string;
  change_type: "new" | "updated";
  version_label: string | null;
  published_date: string | null;
  detected_at: string;
  version_count: number;
}

export interface CrawlHealthItem {
  agency_code: string;
  agency_name: string;
  issue: "never_crawled" | "last_failed" | "zero_items" | "stale";
}

export interface DashboardSummary {
  agency_count: number;
  legal_basis_count: number;
  guideline_count: number;
  announcement_count: number;
  recently_updated_count: number;
  gap_missing: number;
  gap_outdated: number;
  last_global_crawl_at: string | null;
  crawl_health: CrawlHealthItem[];
  category_stats: Record<string, number>;
  gosi_count: number;
  hunryeong_count: number;
  yegyu_count: number;
  agencies: AgencySummary[];
  recent_legal_bases: RecentLegalBasis[];
}

// ── Fetch helper ────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// ── API functions ───────────────────────────────────────

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary");
}

export async function fetchAgencies(): Promise<Agency[]> {
  return apiFetch<Agency[]>("/agencies");
}

export async function fetchAgency(code: string): Promise<Agency> {
  return apiFetch<Agency>(`/agencies/${code}`);
}

export async function seedAgencies(): Promise<{ created: number; skipped: number }> {
  return apiFetch("/agencies/seed", { method: "POST" });
}

export async function fetchGuidelines(params?: {
  agency_code?: string;
  category?: string;
  item_type?: ItemType;
}): Promise<Guideline[]> {
  const search = new URLSearchParams();
  if (params?.agency_code) search.set("agency_code", params.agency_code);
  if (params?.category) search.set("category", params.category);
  if (params?.item_type) search.set("item_type", params.item_type);
  const qs = search.toString();
  return apiFetch<Guideline[]>(`/guidelines${qs ? `?${qs}` : ""}`);
}

export async function fetchLegalBases(params?: {
  agency_code?: string;
}): Promise<LegalBasis[]> {
  const search = new URLSearchParams();
  if (params?.agency_code) search.set("agency_code", params.agency_code);
  const qs = search.toString();
  return apiFetch<LegalBasis[]>(`/legal-bases${qs ? `?${qs}` : ""}`);
}

export async function fetchGapSummary(): Promise<GapSummary> {
  return apiFetch<GapSummary>("/gaps");
}

export async function fetchCrawlStatus(): Promise<CrawlStatus[]> {
  return apiFetch<CrawlStatus[]>("/crawl/status");
}

export async function triggerCrawl(agencyCode: string): Promise<unknown> {
  return apiFetch(`/crawl/${agencyCode}`, { method: "POST" });
}

export async function fetchRecentChanges(params?: {
  days?: number;
  agency_code?: string;
  limit?: number;
}): Promise<RecentChange[]> {
  const search = new URLSearchParams();
  if (params?.days) search.set("days", String(params.days));
  if (params?.agency_code) search.set("agency_code", params.agency_code);
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetch<RecentChange[]>(`/guidelines/recent-changes${qs ? `?${qs}` : ""}`);
}

export interface GuidelineDetail extends Guideline {
  versions: {
    id: number;
    version_label: string | null;
    published_date: string;
    pdf_url: string | null;
    page_count: number | null;
    change_summary: string | null;
    significance: string | null;
  }[];
}

export async function fetchGuidelineDetail(id: number): Promise<GuidelineDetail> {
  return apiFetch<GuidelineDetail>(`/guidelines/${id}`);
}
