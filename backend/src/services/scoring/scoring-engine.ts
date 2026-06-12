import type { SignalType } from '@away/shared';
import { config } from '../../config';
import { getSettings } from '../../db/pool';

export interface ScoringInput {
  employeeCount: number | null;
  city: string | null;
  country: string | null;
  industry: string | null;
  signals: Array<{
    signal_type: SignalType;
    signal_text: string;
    signal_date: string;
    confidence_score: number;
  }>;
  isRemoteOnly: boolean;
  isStaffingAgency: boolean;
  isActive: boolean;
  hasValidWebsite: boolean;
  crmStatus: string | null;
}

export interface ScoringResult {
  fit_score: number;
  intent_score: number;
  timing_score: number;
  overall_score: number;
  score_reasoning: string;
  excluded: boolean;
  exclusion_reason: string | null;
}

const SUPPORTED_CITIES = new Set([
  'bangalore', 'bengaluru', 'vizag', 'visakhapatnam', 'kolkata',
]);

const INDIAN_CITIES = new Set([
  ...SUPPORTED_CITIES,
  'mumbai', 'delhi', 'hyderabad', 'chennai', 'pune', 'ahmedabad',
  'noida', 'gurgaon', 'gurugram',
]);

const INDUSTRY_SCORES: Record<string, number> = {
  saas: 100,
  fintech: 95,
  healthtech: 85,
  'e-commerce': 75,
  ecommerce: 75,
  consulting: 70,
  staffing: 20,
  manufacturing: 15,
};

const HIRING_KEYWORDS: Record<string, number> = {
  'hiring in bangalore': 20,
  'hiring in bengaluru': 20,
  'hiring in vizag': 20,
  'hiring in visakhapatnam': 20,
  'hiring in kolkata': 20,
  'hiring office manager': 20,
  'hiring hr': 20,
  'hiring engineer': 15,
  'hiring customer support': 15,
  'hiring operations': 15,
  'multiple jobs': 20,
  'onsite': 15,
  'hybrid': 15,
};

const SOCIAL_KEYWORDS: Record<string, number> = {
  'looking for office': 40,
  'need office space': 40,
  'hybrid setup': 30,
  'wfh isn\'t working': 40,
  'wfh is not working': 40,
  'team growing': 30,
  'office complaint': 40,
};

const EXPANSION_KEYWORDS: Record<string, number> = {
  'india launch': 35,
  'india expansion': 35,
  'south india': 35,
  'new office': 40,
  'opened office': 40,
  'bangalore expansion': 35,
  'vizag expansion': 35,
  'kolkata expansion': 35,
};

const FUNDING_KEYWORDS = ['seed', 'series a', 'series b', 'expansion capital', 'funding raised', 'raised'];

const BLUE_COLLAR_KEYWORDS = [
  'warehouse', 'driver', 'delivery', 'factory', 'construction',
  'security guard', 'cleaner', 'janitor',
];

export function scoreCompanySize(employeeCount: number | null): number {
  if (employeeCount === null) return 50;
  if (employeeCount <= 5) return 20;
  if (employeeCount <= 20) return 80;
  if (employeeCount <= 100) return 100;
  if (employeeCount <= 300) return 90;
  if (employeeCount <= 1000) return 60;
  return 20;
}

export function scoreLocation(city: string | null, country: string | null): number {
  const normalizedCity = city?.toLowerCase().trim() ?? '';
  const normalizedCountry = country?.toLowerCase().trim() ?? '';

  if (SUPPORTED_CITIES.has(normalizedCity)) return 100;
  if (INDIAN_CITIES.has(normalizedCity) || normalizedCountry === 'india' || normalizedCountry === 'in') {
    return 40;
  }
  return 10;
}

export function scoreIndustry(industry: string | null): number {
  if (!industry) return 50;
  const normalized = industry.toLowerCase().trim();
  return INDUSTRY_SCORES[normalized] ?? 50;
}

export function scoreSignalRecency(signalDate: string): number {
  const now = new Date();
  const date = new Date(signalDate);
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 7) return 100;
  if (daysDiff <= 30) return 80;
  if (daysDiff <= 60) return 50;
  if (daysDiff <= 90) return 25;
  return 0;
}

export function scoreSignals(
  signals: ScoringInput['signals']
): { intentBoost: number; timingScore: number; reasons: string[] } {
  let intentBoost = 0;
  let maxTiming = 0;
  const reasons: string[] = [];

  for (const signal of signals) {
    const text = signal.signal_text.toLowerCase();
    const recency = scoreSignalRecency(signal.signal_date);
    maxTiming = Math.max(maxTiming, recency);

    if (signal.signal_type === 'HIRING_SIGNAL') {
      for (const [keyword, boost] of Object.entries(HIRING_KEYWORDS)) {
        if (text.includes(keyword)) {
          intentBoost += boost;
          reasons.push(`Hiring signal: "${keyword}" (+${boost})`);
        }
      }
    }

    if (signal.signal_type === 'FUNDING_SIGNAL') {
      const daysOld = Math.floor(
        (Date.now() - new Date(signal.signal_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysOld <= 90) {
        for (const keyword of FUNDING_KEYWORDS) {
          if (text.includes(keyword)) {
            intentBoost += 25;
            reasons.push(`Funding signal: "${keyword}" (+25)`);
            break;
          }
        }
      } else {
        reasons.push('Ignored old funding signal (>90 days)');
      }
    }

    if (signal.signal_type === 'SOCIAL_SIGNAL') {
      for (const [keyword, boost] of Object.entries(SOCIAL_KEYWORDS)) {
        if (text.includes(keyword)) {
          intentBoost += boost;
          reasons.push(`Social signal: "${keyword}" (+${boost})`);
        }
      }
    }

    if (signal.signal_type === 'EXPANSION_SIGNAL') {
      for (const [keyword, boost] of Object.entries(EXPANSION_KEYWORDS)) {
        if (text.includes(keyword)) {
          intentBoost += boost;
          reasons.push(`Expansion signal: "${keyword}" (+${boost})`);
        }
      }
    }
  }

  return {
    intentBoost: Math.min(intentBoost, 100),
    timingScore: maxTiming,
    reasons,
  };
}

export function isBlueCollarHiring(signals: ScoringInput['signals']): boolean {
  return signals.some((s) => {
    if (s.signal_type !== 'HIRING_SIGNAL') return false;
    const text = s.signal_text.toLowerCase();
    return BLUE_COLLAR_KEYWORDS.some((kw) => text.includes(kw));
  });
}

export function recommendProduct(employeeCount: number | null): string {
  const count = employeeCount ?? 0;
  if (count <= 5) return 'Day Pass, Meeting Rooms';
  if (count <= 30) return 'Coworking Seats, Private Office';
  if (count <= 100) return 'Managed Office';
  return 'Enterprise Review';
}

export function categorizeSalesQueue(overallScore: number, requiresReview: boolean): string {
  if (requiresReview) return 'manual_review';
  if (overallScore >= 75) return 'immediate_outreach';
  if (overallScore >= 50) return 'nurture';
  return 'ignored';
}

/**
 * Main scoring function - idempotent given same inputs.
 * Returns scores 0-100 for fit, intent, timing, and overall.
 */
export function calculateScores(input: ScoringInput): ScoringResult {
  // Exclusion checks
  if (!input.isActive) {
    return excluded('Company is inactive');
  }
  if (!input.hasValidWebsite) {
    return excluded('No valid website');
  }
  if (input.isRemoteOnly) {
    return excluded('Fully remote company');
  }
  if (input.isStaffingAgency) {
    return excluded('Staffing agency');
  }
  if (input.crmStatus === 'closed_lost') {
    return excluded('Previously closed-lost in CRM');
  }
  if (isBlueCollarHiring(input.signals)) {
    return excluded('Blue collar hiring detected');
  }

  const locationScore = scoreLocation(input.city, input.country);
  if (locationScore <= 10) {
    return excluded('Outside supported regions');
  }

  const sizeScore = scoreCompanySize(input.employeeCount);
  const industryScore = scoreIndustry(input.industry);

  const fit_score = Math.round(
    sizeScore * 0.4 + locationScore * 0.35 + industryScore * 0.25
  );

  const { intentBoost, timingScore, reasons } = scoreSignals(input.signals);
  const baseIntent = Math.min(input.signals.length * 10, 50);
  const intent_score = Math.min(baseIntent + intentBoost, 100);
  const timing_score = timingScore;

  const settings = getSettings();
  const fitWeight = settings.fit_weight ?? 0.4;
  const intentWeight = settings.intent_weight ?? 0.4;
  const timingWeight = settings.timing_weight ?? 0.2;

  const overall_score = Math.round(
    fit_score * fitWeight + intent_score * intentWeight + timing_score * timingWeight
  );

  const score_reasoning = [
    `Fit: size=${sizeScore}, location=${locationScore}, industry=${industryScore}`,
    `Intent: base=${baseIntent}, boost=${intentBoost}`,
    `Timing: ${timing_score}`,
    ...reasons,
    `Recommended: ${recommendProduct(input.employeeCount)}`,
  ].join('; ');

  return {
    fit_score,
    intent_score,
    timing_score,
    overall_score,
    score_reasoning,
    excluded: false,
    exclusion_reason: null,
  };
}

function excluded(reason: string): ScoringResult {
  return {
    fit_score: 0,
    intent_score: 0,
    timing_score: 0,
    overall_score: 0,
    score_reasoning: `Excluded: ${reason}`,
    excluded: true,
    exclusion_reason: reason,
  };
}
