import type { CompanyRow, SignalRow, Pagination } from './types';

export type { CompanyRow, SignalRow, Pagination };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? 'dev-api-key';

// In-memory Mock Data Store for Vercel / standalone frontend demos
const MOCK_COMPANIES = [
  {
    id: "b0e86be6-17a1-42ff-94a0-da2174fd778e",
    name: "Slice",
    website: "https://sliceit.com",
    city: "Bangalore",
    industry: "Fintech",
    employee_count: 400,
    hiring_count: 2,
    crm_status: "synced",
    recommended_product: "Enterprise Review",
    fit_score: 83,
    intent_score: 60,
    timing_score: 100,
    overall_score: 77,
    linkedin_url: "https://linkedin.com/company/sliceit",
    country: "India",
    funding_stage: "Series C",
    latest_funding_date: "2026-04-10",
    estimated_budget: 150000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:37:52.342Z",
    updated_at: "2026-06-12T11:40:13.663Z"
  },
  {
    id: "1b8e5fa3-e79a-4228-8f3a-ab84cf94e029",
    name: "Razorpay",
    website: "https://razorpay.com",
    city: "Bangalore",
    industry: "Fintech",
    employee_count: 2500,
    hiring_count: 1,
    crm_status: "pending",
    recommended_product: "Managed Office",
    fit_score: 95,
    intent_score: 80,
    timing_score: 90,
    overall_score: 88,
    linkedin_url: "https://linkedin.com/company/razorpay",
    country: "India",
    funding_stage: "Series D",
    latest_funding_date: "2026-05-15",
    estimated_budget: 300000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "dfa72a04-6a90-4d11-a125-e36948de46e7",
    name: "Darwinbox",
    website: "https://darwinbox.com",
    city: "Hyderabad",
    industry: "HRTech",
    employee_count: 1200,
    hiring_count: 4,
    crm_status: "pending",
    recommended_product: "Private Office",
    fit_score: 70,
    intent_score: 85,
    timing_score: 75,
    overall_score: 76,
    linkedin_url: "https://linkedin.com/company/darwinbox",
    country: "India",
    funding_stage: "Series D",
    latest_funding_date: "2026-03-22",
    estimated_budget: 180000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "3c7e9a8f-28b9-46dc-a0e2-e1d51a9c3d4f",
    name: "Hasura",
    website: "https://hasura.io",
    city: "Bangalore",
    industry: "SaaS",
    employee_count: 350,
    hiring_count: 3,
    crm_status: "synced",
    recommended_product: "Coworking Seats",
    fit_score: 88,
    intent_score: 90,
    timing_score: 80,
    overall_score: 86,
    linkedin_url: "https://linkedin.com/company/hasura",
    country: "India",
    funding_stage: "Series B",
    latest_funding_date: "2026-02-18",
    estimated_budget: 90000,
    is_active: true,
    is_remote_only: true,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "4d8f1b9a-39c0-57ed-b1f3-f2e62b0d4e5f",
    name: "Groww",
    website: "https://groww.in",
    city: "Bangalore",
    industry: "Fintech",
    employee_count: 1800,
    hiring_count: 5,
    crm_status: "failed",
    recommended_product: "Managed Office",
    fit_score: 90,
    intent_score: 95,
    timing_score: 92,
    overall_score: 92,
    linkedin_url: "https://linkedin.com/company/groww",
    country: "India",
    funding_stage: "Series D",
    latest_funding_date: "2026-06-01",
    estimated_budget: 250000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "5e9f1a7b-40d0-68fe-c2a4-d3e72f0c5f6a",
    name: "Cred",
    website: "https://cred.club",
    city: "Bangalore",
    industry: "Fintech",
    employee_count: 800,
    hiring_count: 3,
    crm_status: "synced",
    recommended_product: "Managed Office",
    fit_score: 85,
    intent_score: 75,
    timing_score: 88,
    overall_score: 82,
    linkedin_url: "https://linkedin.com/company/cred",
    country: "India",
    funding_stage: "Series C",
    latest_funding_date: "2026-05-10",
    estimated_budget: 180000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "6f0a2b8c-51e1-79af-d3b5-e4f83a1d6f7b",
    name: "Swiggy",
    website: "https://swiggy.in",
    city: "Bangalore",
    industry: "FoodTech",
    employee_count: 5000,
    hiring_count: 8,
    crm_status: "pending",
    recommended_product: "Enterprise Review",
    fit_score: 98,
    intent_score: 92,
    timing_score: 90,
    overall_score: 94,
    linkedin_url: "https://linkedin.com/company/swiggy",
    country: "India",
    funding_stage: "IPO",
    latest_funding_date: "2026-06-05",
    estimated_budget: 600000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "7a1b3c9d-62f2-80ba-e4c6-f5g94b2e7f8c",
    name: "Zerodha",
    website: "https://zerodha.com",
    city: "Bangalore",
    industry: "Fintech",
    employee_count: 1000,
    hiring_count: 0,
    crm_status: "synced",
    recommended_product: "Private Office",
    fit_score: 75,
    intent_score: 40,
    timing_score: 50,
    overall_score: 58,
    linkedin_url: "https://linkedin.com/company/zerodha",
    country: "India",
    funding_stage: "Bootstrapped",
    latest_funding_date: null,
    estimated_budget: 120000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "8b2c4d0e-73a3-91cb-f5d7-g6h05c3f8g9d",
    name: "PhonePe",
    website: "https://phonepe.com",
    city: "Bangalore",
    industry: "Fintech",
    employee_count: 3200,
    hiring_count: 6,
    crm_status: "synced",
    recommended_product: "Enterprise Review",
    fit_score: 95,
    intent_score: 88,
    timing_score: 94,
    overall_score: 92,
    linkedin_url: "https://linkedin.com/company/phonepe",
    country: "India",
    funding_stage: "Series D",
    latest_funding_date: "2026-04-18",
    estimated_budget: 450000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "9c3d5e1f-84b4-a2dc-g6e8-h7i16d4g9h0e",
    name: "Ola",
    website: "https://olacabs.com",
    city: "Bangalore",
    industry: "Mobility",
    employee_count: 4000,
    hiring_count: 3,
    crm_status: "pending",
    recommended_product: "Managed Office",
    fit_score: 92,
    intent_score: 70,
    timing_score: 78,
    overall_score: 81,
    linkedin_url: "https://linkedin.com/company/ola",
    country: "India",
    funding_stage: "Series E",
    latest_funding_date: "2026-02-14",
    estimated_budget: 280000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "ad4e6f2g-95c5-b3ed-h7f9-i8j27e5h0i1f",
    name: "Flipkart",
    website: "https://flipkart.com",
    city: "Bangalore",
    industry: "E-commerce",
    employee_count: 15000,
    hiring_count: 12,
    crm_status: "synced",
    recommended_product: "Enterprise Review",
    fit_score: 99,
    intent_score: 95,
    timing_score: 96,
    overall_score: 97,
    linkedin_url: "https://linkedin.com/company/flipkart",
    country: "India",
    funding_stage: "Late Stage",
    latest_funding_date: "2026-05-28",
    estimated_budget: 900000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "be5f7g3h-06d6-c4fe-i8g0-j9k38f6i1j2g",
    name: "Meesho",
    website: "https://meesho.com",
    city: "Bangalore",
    industry: "E-commerce",
    employee_count: 2000,
    hiring_count: 4,
    crm_status: "pending",
    recommended_product: "Private Office",
    fit_score: 88,
    intent_score: 82,
    timing_score: 85,
    overall_score: 85,
    linkedin_url: "https://linkedin.com/company/meesho",
    country: "India",
    funding_stage: "Series E",
    latest_funding_date: "2026-04-30",
    estimated_budget: 220000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "cf6h8i4j-17e7-d5gf-j9h1-k0l49g7j2k3h",
    name: "Innovaccer",
    website: "https://innovaccer.com",
    city: "Vizag",
    industry: "HealthTech",
    employee_count: 1500,
    hiring_count: 2,
    crm_status: "synced",
    recommended_product: "Private Office",
    fit_score: 90,
    intent_score: 75,
    timing_score: 80,
    overall_score: 82,
    linkedin_url: "https://linkedin.com/company/innovaccer",
    country: "India",
    funding_stage: "Series D",
    latest_funding_date: "2026-03-15",
    estimated_budget: 180000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "dg7i9j5k-28f8-e6hg-k0i2-l1m50h8k3l4i",
    name: "Nykaa",
    website: "https://nykaa.com",
    city: "Mumbai",
    industry: "E-commerce",
    employee_count: 3000,
    hiring_count: 3,
    crm_status: "pending",
    recommended_product: "Managed Office",
    fit_score: 70,
    intent_score: 65,
    timing_score: 60,
    overall_score: 65,
    linkedin_url: "https://linkedin.com/company/nykaa",
    country: "India",
    funding_stage: "Public",
    latest_funding_date: null,
    estimated_budget: 260000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "eh8j0k6l-39g9-f7ih-l1j3-m2n51i9l4m5j",
    name: "InMobi",
    website: "https://inmobi.com",
    city: "Bangalore",
    industry: "AdTech",
    employee_count: 2200,
    hiring_count: 2,
    crm_status: "synced",
    recommended_product: "Private Office",
    fit_score: 85,
    intent_score: 70,
    timing_score: 72,
    overall_score: 76,
    linkedin_url: "https://linkedin.com/company/inmobi",
    country: "India",
    funding_stage: "Late Stage",
    latest_funding_date: "2026-01-20",
    estimated_budget: 200000,
    is_active: true,
    is_remote_only: false,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "fi9k1l7m-40h0-g8ji-m2k4-n3o52j0m5n6k",
    name: "Techno Ltd",
    website: "https://technoltd.in",
    city: "Vizag",
    industry: "SaaS",
    employee_count: 150,
    hiring_count: 3,
    crm_status: "pending",
    recommended_product: "Coworking Seats",
    fit_score: 80,
    intent_score: 85,
    timing_score: 78,
    overall_score: 81,
    linkedin_url: "https://linkedin.com/company/technoltd",
    country: "India",
    funding_stage: "Series A",
    latest_funding_date: "2026-04-05",
    estimated_budget: 50000,
    is_active: true,
    is_remote_only: true,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  },
  {
    id: "gj0l2m8n-51i1-h9kj-n3l5-o4p53k1n6o7l",
    name: "Kolkata Solutions",
    website: "https://kolkatasolutions.com",
    city: "Kolkata",
    industry: "SaaS",
    employee_count: 90,
    hiring_count: 1,
    crm_status: "synced",
    recommended_product: "Day Pass",
    fit_score: 72,
    intent_score: 60,
    timing_score: 65,
    overall_score: 66,
    linkedin_url: "https://linkedin.com/company/kolkatasolutions",
    country: "India",
    funding_stage: "Seed",
    latest_funding_date: "2026-02-10",
    estimated_budget: 25000,
    is_active: true,
    is_remote_only: true,
    is_staffing_agency: false,
    created_at: "2026-06-12T11:40:12.618Z",
    updated_at: "2026-06-12T11:40:12.624Z"
  }
];

const MOCK_SIGNALS = [
  {
    id: "sig1",
    company_id: "b0e86be6-17a1-42ff-94a0-da2174fd778e",
    company_name: "Slice",
    signal_type: "HIRING_SIGNAL",
    signal_source: "career_page",
    signal_text: "Hiring in Bangalore - engineers, HR, office manager roles",
    signal_date: "2026-06-12",
    confidence_score: 0.9,
    city: "Bangalore",
    industry: "Fintech",
    website: "https://sliceit.com",
    created_at: "2026-06-12T12:00:00.000Z"
  },
  {
    id: "sig2",
    company_id: "1b8e5fa3-e79a-4228-8f3a-ab84cf94e029",
    company_name: "Razorpay",
    signal_type: "FUNDING_SIGNAL",
    signal_source: "news_api",
    signal_text: "Razorpay secures $100M in Series D round to fuel Indian expansion",
    signal_date: "2026-06-11",
    confidence_score: 0.95,
    city: "Bangalore",
    industry: "Fintech",
    website: "https://razorpay.com",
    created_at: "2026-06-11T12:00:00.000Z"
  },
  {
    id: "sig3",
    company_id: "dfa72a04-6a90-4d11-a125-e36948de46e7",
    company_name: "Darwinbox",
    signal_type: "EXPANSION_SIGNAL",
    signal_source: "news_api",
    signal_text: "Darwinbox launches new regional office in Hyderabad with large capacity",
    signal_date: "2026-06-10",
    confidence_score: 0.85,
    city: "Hyderabad",
    industry: "HRTech",
    website: "https://darwinbox.com",
    created_at: "2026-06-10T12:00:00.000Z"
  },
  {
    id: "sig4",
    company_id: "3c7e9a8f-28b9-46dc-a0e2-e1d51a9c3d4f",
    company_name: "Hasura",
    signal_type: "SOCIAL_SIGNAL",
    signal_source: "twitter",
    signal_text: "Hasura developers sharing workspace setup photos and discussing hybrid models",
    signal_date: "2026-06-09",
    confidence_score: 0.8,
    city: "Bangalore",
    industry: "SaaS",
    website: "https://hasura.io",
    created_at: "2026-06-09T12:00:00.000Z"
  },
  {
    id: "sig5",
    company_id: "4d8f1b9a-39c0-57ed-b1f3-f2e62b0d4e5f",
    company_name: "Groww",
    signal_type: "HIRING_SIGNAL",
    signal_source: "wellfound",
    signal_text: "Groww posting multiple hybrid/in-office jobs for product teams in Bangalore",
    signal_date: "2026-06-08",
    confidence_score: 0.92,
    city: "Bangalore",
    industry: "Fintech",
    website: "https://groww.in",
    created_at: "2026-06-08T12:00:00.000Z"
  },
  {
    id: "sig6",
    company_id: "5e9f1a7b-40d0-68fe-c2a4-d3e72f0c5f6a",
    company_name: "Cred",
    signal_type: "HIRING_SIGNAL",
    signal_source: "google_jobs",
    signal_text: "Cred hiring operations managers and customer support leads in Bangalore",
    signal_date: "2026-06-07",
    confidence_score: 0.88,
    city: "Bangalore",
    industry: "Fintech",
    website: "https://cred.club",
    created_at: "2026-06-07T12:00:00.000Z"
  },
  {
    id: "sig7",
    company_id: "6f0a2b8c-51e1-79af-d3b5-e4f83a1d6f7b",
    company_name: "Swiggy",
    signal_type: "EXPANSION_SIGNAL",
    signal_source: "news_api",
    signal_text: "Swiggy signs major lease for corporate hub expansion in Bangalore tech park",
    signal_date: "2026-06-06",
    confidence_score: 0.97,
    city: "Bangalore",
    industry: "FoodTech",
    website: "https://swiggy.in",
    created_at: "2026-06-06T12:00:00.000Z"
  },
  {
    id: "sig8",
    company_id: "8b2c4d0e-73a3-91cb-f5d7-g6h05c3f8g9d",
    company_name: "PhonePe",
    signal_type: "FUNDING_SIGNAL",
    signal_source: "crunchbase",
    signal_text: "PhonePe completes massive $200M internal round for digital banking expansion",
    signal_date: "2026-06-05",
    confidence_score: 0.94,
    city: "Bangalore",
    industry: "Fintech",
    website: "https://phonepe.com",
    created_at: "2026-06-05T12:00:00.000Z"
  },
  {
    id: "sig9",
    company_id: "cf6h8i4j-17e7-d5gf-j9h1-k0l49g7j2k3h",
    company_name: "Innovaccer",
    signal_type: "EXPANSION_SIGNAL",
    signal_source: "news_api",
    signal_text: "Innovaccer expands healthcare engineering hub in Vizag with local hires",
    signal_date: "2026-06-04",
    confidence_score: 0.89,
    city: "Vizag",
    industry: "HealthTech",
    website: "https://innovaccer.com",
    created_at: "2026-06-04T12:00:00.000Z"
  },
  {
    id: "sig10",
    company_id: "fi9k1l7m-40h0-g8ji-m2k4-n3o52j0m5n6k",
    company_name: "Techno Ltd",
    signal_type: "HIRING_SIGNAL",
    signal_source: "career_page",
    signal_text: "Active job listings for product support agents and sales reps in Vizag office",
    signal_date: "2026-06-03",
    confidence_score: 0.85,
    city: "Vizag",
    industry: "SaaS",
    website: "https://technoltd.in",
    created_at: "2026-06-03T12:00:00.000Z"
  }
];

const MOCK_OUTREACH = {
  "b0e86be6-17a1-42ff-94a0-da2174fd778e": {
    id: "out1",
    company_id: "b0e86be6-17a1-42ff-94a0-da2174fd778e",
    recommended_product: "Enterprise Review",
    outreach_angle: "Expansion and hiring in Bangalore office",
    subject: "Slice — workspace solution for your Bangalore team",
    personalization: "I noticed Hiring in Bangalore - engineers, HR, office manager roles and thought away.center could support Slice's workspace needs.",
    pain_point: "Growing teams need flexible workspace without long-term lease commitments",
    cta: "Would you be open to a 15-minute call to explore workspace options?",
    ai_confidence: 0.65,
    requires_human_review: true,
    created_at: "2026-06-12"
  },
  "1b8e5fa3-e79a-4228-8f3a-ab84cf94e029": {
    id: "out2",
    company_id: "1b8e5fa3-e79a-4228-8f3a-ab84cf94e029",
    recommended_product: "Managed Office",
    outreach_angle: "New funding round expansion",
    subject: "Flexible managed offices for Razorpay's growth",
    personalization: "Congratulations on the recent $100M funding. Since you are expanding operations, Away Center can design and operate a custom managed office for your team.",
    pain_point: "High upfront capital expenditure on workspace design and operations",
    cta: "Let's schedule a brief visit to our premium co-working spaces in Bangalore.",
    ai_confidence: 0.88,
    requires_human_review: false,
    created_at: "2026-06-12"
  },
  "cf6h8i4j-17e7-d5gf-j9h1-k0l49g7j2k3h": {
    id: "out3",
    company_id: "cf6h8i4j-17e7-d5gf-j9h1-k0l49g7j2k3h",
    recommended_product: "Private Office",
    outreach_angle: "Vizag hub expansion support",
    subject: "Flexible office workspace for Innovaccer's Vizag team",
    personalization: "Congratulations on your recent expansion in Vizag! Away Center can set up fully managed private offices to support your growing engineering hub.",
    pain_point: "Scaling local headcount without committing to rigid real estate contracts",
    cta: "Would you like to visit our flexible spaces in Vizag this week?",
    ai_confidence: 0.84,
    requires_human_review: false,
    created_at: "2026-06-12"
  }
};

let mockContactsStore: Record<string, any[]> = {
  "b0e86be6-17a1-42ff-94a0-da2174fd778e": [
    {
      id: "c1",
      company_id: "b0e86be6-17a1-42ff-94a0-da2174fd778e",
      name: "Amit Patel",
      title: "Operations Director",
      linkedin_url: "https://linkedin.com/in/amit-patel",
      email: "amit.patel@sliceit.com",
      seniority: "Director",
      decision_maker: true,
      created_at: "2026-06-12"
    }
  ]
};

let mockSettings = {
  signal_collection_cron: '0 */6 * * *',
  last_run: '2026-06-12T17:00:00.000Z',
  last_run_status: 'success',
  fit_weight: 0.35,
  intent_weight: 0.35,
  timing_weight: 0.3
};

let mockHistory = [
  {
    id: "h1",
    action: "signal_collection",
    entity_type: "pipeline",
    entity_id: null,
    details: {
      success: true,
      duration: 1250,
      trigger_type: "automatic" as const
    },
    ip_address: "127.0.0.1",
    created_at: "2026-06-12T17:00:00.000Z"
  },
  {
    id: "h2",
    action: "score_recalculation",
    entity_type: "pipeline",
    entity_id: null,
    details: {
      success: true,
      duration: 450,
      trigger_type: "manual" as const
    },
    ip_address: "127.0.0.1",
    created_at: "2026-06-12T17:45:00.000Z"
  }
];

function getMockFallback(path: string, options?: RequestInit): any {
  // 1. Dashboard summary
  if (path === '/api/dashboard/summary') {
    return {
      high_intent_leads: MOCK_COMPANIES.filter(c => c.overall_score >= 75).length,
      new_signals: MOCK_SIGNALS.length,
      qualified_accounts: MOCK_COMPANIES.length,
      leads_sent_to_crm: MOCK_COMPANIES.filter(c => c.crm_status === 'synced').length,
      conversion_rate: 40,
      signals_by_type: {
        HIRING_SIGNAL: MOCK_SIGNALS.filter(s => s.signal_type === 'HIRING_SIGNAL').length,
        FUNDING_SIGNAL: MOCK_SIGNALS.filter(s => s.signal_type === 'FUNDING_SIGNAL').length,
        SOCIAL_SIGNAL: MOCK_SIGNALS.filter(s => s.signal_type === 'SOCIAL_SIGNAL').length,
        EXPANSION_SIGNAL: MOCK_SIGNALS.filter(s => s.signal_type === 'EXPANSION_SIGNAL').length
      },
      top_cities: [
        { city: "Bangalore", count: MOCK_COMPANIES.filter(c => c.city === 'Bangalore').length },
        { city: "Hyderabad", count: MOCK_COMPANIES.filter(c => c.city === 'Hyderabad').length }
      ]
    };
  }

  // 2. Add Contact POST request
  if (path.includes('/contacts') && options?.method === 'POST') {
    const parts = path.split('/');
    const companyId = parts[3]; // /api/companies/[id]/contacts
    const body = JSON.parse(options.body as string);
    const newContact = {
      id: `c_${Math.random().toString(36).substring(2, 9)}`,
      company_id: companyId,
      name: body.name,
      title: body.title || null,
      linkedin_url: body.linkedin_url || null,
      email: body.email || null,
      seniority: body.seniority || null,
      decision_maker: !!body.decision_maker,
      created_at: new Date().toISOString()
    };
    if (!mockContactsStore[companyId]) {
      mockContactsStore[companyId] = [];
    }
    mockContactsStore[companyId].push(newContact);
    return newContact;
  }

  // 3. Company Detail page
  if (path.startsWith('/api/companies/')) {
    const parts = path.split('/');
    const id = parts[3];
    const company = MOCK_COMPANIES.find(c => c.id === id);
    if (!company) {
      throw new Error("Mock company not found");
    }
    const signals = MOCK_SIGNALS.filter(s => s.company_id === id);
    const contacts = mockContactsStore[id] || [];
    const outreach = MOCK_OUTREACH[id as keyof typeof MOCK_OUTREACH] || {
      id: `out_${id}`,
      company_id: id,
      recommended_product: "Day Pass" as const,
      outreach_angle: "Workspace discovery",
      subject: `Workspace needs for ${company.name}`,
      personalization: `Hi team, I noticed you are located in ${company.city} and might need flexible office space.`,
      pain_point: "Finding temporary office space",
      cta: "Can we chat this week?",
      ai_confidence: 0.7,
      requires_human_review: false,
      created_at: new Date().toISOString()
    };
    return {
      ...company,
      signals,
      contacts,
      score: {
        id: `sc_${id}`,
        company_id: id,
        fit_score: company.fit_score,
        intent_score: company.intent_score,
        timing_score: company.timing_score,
        overall_score: company.overall_score,
        score_reasoning: `Based on size (${company.employee_count}), location in ${company.city}, and active hiring signals.`,
        updated_at: new Date().toISOString()
      },
      crm_record: {
        id: `crm_${id}`,
        company_id: id,
        zoho_lead_id: company.crm_status === 'synced' ? '556677' : null,
        status: company.crm_status as any,
        assigned_salesperson: "Sales Team",
        last_updated: new Date().toISOString(),
        retry_count: 0,
        last_error: null
      },
      outreach
    };
  }

  // 4. Company List page
  if (path.startsWith('/api/companies')) {
    return {
      data: MOCK_COMPANIES,
      pagination: {
        page: 1,
        limit: 50,
        total: MOCK_COMPANIES.length,
        total_pages: 1
      }
    };
  }

  // 5. Signals list page
  if (path.startsWith('/api/signals')) {
    return {
      data: MOCK_SIGNALS
    };
  }

  // 6. Sales Queue page
  if (path.startsWith('/api/sales-queue')) {
    const queue = MOCK_COMPANIES.map(c => {
      let category = 'nurture' as any;
      if (c.overall_score >= 80) category = 'immediate_outreach';
      else if (c.overall_score >= 75) category = 'manual_review';
      
      const nextAction =
        category === 'immediate_outreach' ? 'Contact within 24h' :
        category === 'nurture' ? 'Add to nurture sequence' :
        category === 'manual_review' ? 'Review AI outreach before sending' :
        'No action needed';

      return {
        company_id: c.id,
        company_name: c.name,
        overall_score: c.overall_score,
        category,
        recommended_product: c.recommended_product,
        next_action: nextAction,
        signal_count: MOCK_SIGNALS.filter(s => s.company_id === c.id).length,
        latest_signal_date: "2026-06-12"
      };
    });

    const grouped = {
      immediate_outreach: queue.filter(q => q.category === 'immediate_outreach'),
      nurture: queue.filter(q => q.category === 'nurture'),
      manual_review: queue.filter(q => q.category === 'manual_review'),
      ignored: queue.filter(q => q.category === 'ignored')
    };

    return {
      data: queue,
      grouped
    };
  }

  // 7. Settings GET and POST
  if (path === '/api/settings') {
    if (options?.method === 'POST') {
      const body = JSON.parse(options.body as string);
      mockSettings = { ...mockSettings, ...body };
      return mockSettings;
    }
    return mockSettings;
  }

  // 8. Scheduler History
  if (path === '/api/scheduler/history') {
    return mockHistory;
  }

  // 9. Recalculate, Sync, Trigger Actions
  if (path === '/api/scores/recalculate') {
    mockHistory.unshift({
      id: `h_${Math.random()}`,
      action: "score_recalculation",
      entity_type: "pipeline",
      entity_id: null,
      details: { success: true, duration: 320, trigger_type: "manual" },
      ip_address: "127.0.0.1",
      created_at: new Date().toISOString()
    });
    return { count: MOCK_COMPANIES.length };
  }

  if (path === '/api/crm/sync') {
    mockHistory.unshift({
      id: `h_${Math.random()}`,
      action: "crm_sync",
      entity_type: "pipeline",
      entity_id: null,
      details: { success: true, duration: 410, trigger_type: "manual" },
      ip_address: "127.0.0.1",
      created_at: new Date().toISOString()
    });
    return { synced: MOCK_COMPANIES.filter(c => c.crm_status === 'pending').length };
  }

  if (path === '/api/pipeline/run') {
    mockHistory.unshift({
      id: `h_${Math.random()}`,
      action: "signal_collection",
      entity_type: "pipeline",
      entity_id: null,
      details: { success: true, duration: 920, trigger_type: "manual" },
      ip_address: "127.0.0.1",
      created_at: new Date().toISOString()
    });
    return { message: "Pipeline executed successfully" };
  }

  return null;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-user-role': 'admin',
        ...options?.headers,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      return await res.json();
    }
    throw new Error(`API returned status: ${res.status}`);
  } catch (err) {
    console.warn(`API request to ${path} failed, falling back to mock data.`, err);
    return getMockFallback(path, options) as T;
  }
}

export const api = {
  getDashboardSummary: () => fetchApi<import('@away/shared').DashboardSummary>('/api/dashboard/summary'),

  getCompanies: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<{ data: CompanyRow[]; pagination: Pagination }>(`/api/companies${query}`);
  },

  getCompany: (id: string) => fetchApi<import('@away/shared').CompanyWithDetails>(`/api/companies/${id}`),

  addContact: (companyId: string, data: {
    name: string;
    title?: string;
    email?: string;
    linkedin_url?: string;
    seniority?: string;
    decision_maker?: boolean;
  }) => fetchApi<import('@away/shared').Contact>(`/api/companies/${companyId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getSignals: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchApi<{ data: SignalRow[] }>(`/api/signals${query}`);
  },

  getSalesQueue: (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return fetchApi<{
      data: import('@away/shared').SalesQueueItem[];
      grouped: Record<string, import('@away/shared').SalesQueueItem[]>;
    }>(`/api/sales-queue${query}`);
  },

  recalculateScores: () =>
    fetchApi<{ count: number }>('/api/scores/recalculate', { method: 'POST' }),

  syncCrm: () =>
    fetchApi<{ synced: number }>('/api/crm/sync', { method: 'POST' }),

  triggerPipeline: () =>
    fetchApi<{ message: string }>('/api/pipeline/run', { method: 'POST' }),

  getSettings: () => fetchApi<{
    signal_collection_cron: string;
    last_run: string | null;
    last_run_status: string;
    fit_weight: number;
    intent_weight: number;
    timing_weight: number;
  }>('/api/settings'),

  updateSettings: (settings: {
    signal_collection_cron?: string;
    fit_weight?: number;
    intent_weight?: number;
    timing_weight?: number;
  }) => fetchApi<any>('/api/settings', {
    method: 'POST',
    body: JSON.stringify(settings)
  }),

  getSchedulerHistory: () => fetchApi<Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    details: {
      success: boolean;
      duration: number;
      trigger_type: 'automatic' | 'manual';
      error?: string;
    };
    ip_address: string | null;
    created_at: string;
  }>>('/api/scheduler/history'),
};

// Re-export utils for backward compatibility
export { getScoreClass, formatScore } from './utils/scores';
export {
  getSignalBadgeClass,
  formatSignalType,
  formatSignalSource,
  formatConfidence,
} from './utils/signals';
