import type { CompanyRow, SignalRow, Pagination } from './types';

export type { CompanyRow, SignalRow, Pagination };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? 'dev-api-key';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
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

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
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
