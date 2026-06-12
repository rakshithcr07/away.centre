export type SignalType = 'HIRING_SIGNAL' | 'FUNDING_SIGNAL' | 'SOCIAL_SIGNAL' | 'EXPANSION_SIGNAL';
export type SignalSource = 'google_jobs' | 'wellfound' | 'career_page' | 'crunchbase' | 'news_api' | 'linkedin' | 'twitter' | 'manual';
export type CrmStatus = 'pending' | 'synced' | 'failed' | 'closed_won' | 'closed_lost' | 'dead_letter';
export type SalesQueueCategory = 'immediate_outreach' | 'nurture' | 'manual_review' | 'ignored';
export type RecommendedProduct = 'Day Pass' | 'Meeting Rooms' | 'Coworking Seats' | 'Private Office' | 'Managed Office' | 'Enterprise Review';
export interface Company {
    id: string;
    name: string;
    normalized_name: string | null;
    website: string | null;
    linkedin_url: string | null;
    industry: string | null;
    employee_count: number | null;
    city: string | null;
    country: string | null;
    funding_stage: string | null;
    latest_funding_date: string | null;
    estimated_budget: number | null;
    is_active: boolean;
    is_remote_only: boolean;
    is_staffing_agency: boolean;
    hiring_count: number;
    created_at: string;
    updated_at: string;
}
export interface Signal {
    id: string;
    company_id: string;
    signal_type: SignalType;
    signal_source: SignalSource;
    signal_text: string;
    signal_date: string;
    confidence_score: number;
    is_duplicate: boolean;
    is_active: boolean;
    raw_payload: Record<string, unknown> | null;
    created_at: string;
}
export interface Contact {
    id: string;
    company_id: string;
    name: string;
    title: string | null;
    linkedin_url: string | null;
    email: string | null;
    seniority: string | null;
    decision_maker: boolean;
    created_at: string;
}
export interface Score {
    id: string;
    company_id: string;
    fit_score: number;
    intent_score: number;
    timing_score: number;
    overall_score: number;
    score_reasoning: string | null;
    updated_at: string;
}
export interface CrmRecord {
    id: string;
    company_id: string;
    zoho_lead_id: string | null;
    status: CrmStatus;
    assigned_salesperson: string | null;
    last_updated: string;
    retry_count: number;
    last_error: string | null;
}
export interface OutreachRecommendation {
    id: string;
    company_id: string;
    recommended_product: RecommendedProduct;
    outreach_angle: string;
    generated_message: string;
    subject: string | null;
    personalization: string | null;
    pain_point: string | null;
    cta: string | null;
    ai_confidence: number;
    requires_human_review: boolean;
    created_at: string;
}
export interface DashboardSummary {
    high_intent_leads: number;
    new_signals: number;
    qualified_accounts: number;
    leads_sent_to_crm: number;
    conversion_rate: number;
    signals_by_type: Record<SignalType, number>;
    top_cities: Array<{
        city: string;
        count: number;
    }>;
}
export interface CompanyWithDetails extends Company {
    signals: Signal[];
    contacts: Contact[];
    score: Score | null;
    crm_record: CrmRecord | null;
    outreach: OutreachRecommendation | null;
}
export interface SalesQueueItem {
    company_id: string;
    company_name: string;
    overall_score: number;
    category: SalesQueueCategory;
    recommended_product: string | null;
    next_action: string;
    signal_count: number;
    latest_signal_date: string | null;
}
export interface OutreachMessageJson {
    subject: string;
    personalization: string;
    pain_point: string;
    recommended_product: RecommendedProduct;
    cta: string;
    confidence: number;
}
