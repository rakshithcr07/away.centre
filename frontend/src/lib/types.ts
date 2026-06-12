export interface CompanyRow {
  id: string;
  name: string;
  website: string | null;
  linkedin_url: string | null;
  industry: string | null;
  city: string | null;
  employee_count: number | null;
  hiring_count: number;
  signal_types: string[] | null;
  fit_score: number | null;
  intent_score: number | null;
  timing_score: number | null;
  overall_score: number | null;
  recommended_product: string | null;
  crm_status: string | null;
  assigned_salesperson: string | null;
}

export interface SignalRow {
  id: string;
  company_id: string;
  company_name: string;
  signal_type: string;
  signal_source: string;
  signal_text: string;
  signal_date: string;
  confidence_score: number;
  city: string | null;
  industry: string | null;
  website: string | null;
  created_at?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export type KpiColor = 'green' | 'blue' | 'amber' | 'purple';

export type SalesQueueCategory = 'immediate_outreach' | 'nurture' | 'manual_review' | 'ignored';
