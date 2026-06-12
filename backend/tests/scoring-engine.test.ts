import { describe, it, expect } from 'vitest';
import {
  calculateScores,
  scoreCompanySize,
  scoreLocation,
  scoreIndustry,
  scoreSignalRecency,
  recommendProduct,
  categorizeSalesQueue,
  type ScoringInput,
} from '../src/services/scoring/scoring-engine';

function baseInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    employeeCount: 50,
    city: 'Bangalore',
    country: 'India',
    industry: 'SaaS',
    signals: [],
    isRemoteOnly: false,
    isStaffingAgency: false,
    isActive: true,
    hasValidWebsite: true,
    crmStatus: null,
    ...overrides,
  };
}

describe('scoreCompanySize', () => {
  it('scores 1-5 employees as 20', () => {
    expect(scoreCompanySize(3)).toBe(20);
    expect(scoreCompanySize(5)).toBe(20);
  });

  it('scores 6-20 employees as 80', () => {
    expect(scoreCompanySize(6)).toBe(80);
    expect(scoreCompanySize(20)).toBe(80);
  });

  it('scores 21-100 employees as 100', () => {
    expect(scoreCompanySize(21)).toBe(100);
    expect(scoreCompanySize(100)).toBe(100);
  });

  it('scores 101-300 employees as 90', () => {
    expect(scoreCompanySize(101)).toBe(90);
    expect(scoreCompanySize(300)).toBe(90);
  });

  it('scores 301-1000 employees as 60', () => {
    expect(scoreCompanySize(301)).toBe(60);
    expect(scoreCompanySize(1000)).toBe(60);
  });

  it('scores 1000+ employees as 20', () => {
    expect(scoreCompanySize(1001)).toBe(20);
    expect(scoreCompanySize(5000)).toBe(20);
  });

  it('returns 50 for null', () => {
    expect(scoreCompanySize(null)).toBe(50);
  });
});

describe('scoreLocation', () => {
  it('scores Bangalore at 100', () => {
    expect(scoreLocation('Bangalore', 'India')).toBe(100);
    expect(scoreLocation('Bengaluru', 'India')).toBe(100);
  });

  it('scores Vizag at 100', () => {
    expect(scoreLocation('Vizag', 'India')).toBe(100);
    expect(scoreLocation('Visakhapatnam', 'India')).toBe(100);
  });

  it('scores Kolkata at 100', () => {
    expect(scoreLocation('Kolkata', 'India')).toBe(100);
  });

  it('scores other Indian cities at 40', () => {
    expect(scoreLocation('Mumbai', 'India')).toBe(40);
    expect(scoreLocation('Hyderabad', 'India')).toBe(40);
  });

  it('scores outside India at 10', () => {
    expect(scoreLocation('San Francisco', 'USA')).toBe(10);
    expect(scoreLocation(null, 'Germany')).toBe(10);
  });
});

describe('scoreIndustry', () => {
  it('scores SaaS at 100', () => {
    expect(scoreIndustry('SaaS')).toBe(100);
  });

  it('scores Fintech at 95', () => {
    expect(scoreIndustry('Fintech')).toBe(95);
  });

  it('scores Staffing at 20', () => {
    expect(scoreIndustry('Staffing')).toBe(20);
  });

  it('returns 50 for unknown industry', () => {
    expect(scoreIndustry('Unknown')).toBe(50);
    expect(scoreIndustry(null)).toBe(50);
  });
});

describe('scoreSignalRecency', () => {
  it('scores signals within 7 days at 100', () => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    expect(scoreSignalRecency(date.toISOString())).toBe(100);
  });

  it('scores signals within 30 days at 80', () => {
    const date = new Date();
    date.setDate(date.getDate() - 20);
    expect(scoreSignalRecency(date.toISOString())).toBe(80);
  });

  it('scores signals within 60 days at 50', () => {
    const date = new Date();
    date.setDate(date.getDate() - 45);
    expect(scoreSignalRecency(date.toISOString())).toBe(50);
  });

  it('scores signals within 90 days at 25', () => {
    const date = new Date();
    date.setDate(date.getDate() - 75);
    expect(scoreSignalRecency(date.toISOString())).toBe(25);
  });

  it('scores older signals at 0', () => {
    const date = new Date();
    date.setDate(date.getDate() - 120);
    expect(scoreSignalRecency(date.toISOString())).toBe(0);
  });
});

describe('recommendProduct', () => {
  it('recommends Day Pass for <=5 employees', () => {
    expect(recommendProduct(3)).toBe('Day Pass, Meeting Rooms');
  });

  it('recommends Coworking for 6-30 employees', () => {
    expect(recommendProduct(15)).toBe('Coworking Seats, Private Office');
  });

  it('recommends Managed Office for 31-100 employees', () => {
    expect(recommendProduct(50)).toBe('Managed Office');
  });

  it('recommends Enterprise Review for 100+ employees', () => {
    expect(recommendProduct(200)).toBe('Enterprise Review');
  });
});

describe('categorizeSalesQueue', () => {
  it('categorizes high scores as immediate outreach', () => {
    expect(categorizeSalesQueue(80, false)).toBe('immediate_outreach');
  });

  it('categorizes medium scores as nurture', () => {
    expect(categorizeSalesQueue(60, false)).toBe('nurture');
  });

  it('categorizes low scores as ignored', () => {
    expect(categorizeSalesQueue(30, false)).toBe('ignored');
  });

  it('requires manual review when flagged', () => {
    expect(categorizeSalesQueue(90, true)).toBe('manual_review');
  });
});

describe('calculateScores', () => {
  it('calculates overall score with correct weighting', () => {
    const recentDate = new Date().toISOString().split('T')[0];
    const result = calculateScores(
      baseInput({
        signals: [
          {
            signal_type: 'HIRING_SIGNAL',
            signal_text: 'Hiring in Bangalore - multiple jobs posted',
            signal_date: recentDate,
            confidence_score: 0.9,
          },
          {
            signal_type: 'FUNDING_SIGNAL',
            signal_text: 'Raised Series A funding',
            signal_date: recentDate,
            confidence_score: 0.85,
          },
        ],
      })
    );

    expect(result.excluded).toBe(false);
    expect(result.fit_score).toBeGreaterThan(0);
    expect(result.intent_score).toBeGreaterThan(0);
    expect(result.timing_score).toBe(100);
    expect(result.overall_score).toBe(
      Math.round(result.fit_score * 0.4 + result.intent_score * 0.4 + result.timing_score * 0.2)
    );
  });

  it('excludes fully remote companies', () => {
    const result = calculateScores(baseInput({ isRemoteOnly: true }));
    expect(result.excluded).toBe(true);
    expect(result.overall_score).toBe(0);
    expect(result.exclusion_reason).toContain('remote');
  });

  it('excludes staffing agencies', () => {
    const result = calculateScores(baseInput({ isStaffingAgency: true }));
    expect(result.excluded).toBe(true);
  });

  it('excludes companies without valid website', () => {
    const result = calculateScores(baseInput({ hasValidWebsite: false }));
    expect(result.excluded).toBe(true);
  });

  it('excludes closed-lost CRM records', () => {
    const result = calculateScores(baseInput({ crmStatus: 'closed_lost' }));
    expect(result.excluded).toBe(true);
  });

  it('excludes companies outside supported regions', () => {
    const result = calculateScores(
      baseInput({ city: 'New York', country: 'USA' })
    );
    expect(result.excluded).toBe(true);
  });

  it('excludes blue collar hiring', () => {
    const result = calculateScores(
      baseInput({
        signals: [
          {
            signal_type: 'HIRING_SIGNAL',
            signal_text: 'Hiring warehouse workers and delivery drivers',
            signal_date: new Date().toISOString().split('T')[0],
            confidence_score: 0.8,
          },
        ],
      })
    );
    expect(result.excluded).toBe(true);
  });

  it('ignores funding older than 90 days', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 120);

    const result = calculateScores(
      baseInput({
        signals: [
          {
            signal_type: 'FUNDING_SIGNAL',
            signal_text: 'Raised Series A funding',
            signal_date: oldDate.toISOString().split('T')[0],
            confidence_score: 0.8,
          },
        ],
      })
    );

    expect(result.score_reasoning).toContain('Ignored old funding');
  });

  it('is idempotent for same inputs', () => {
    const input = baseInput({
      signals: [
        {
          signal_type: 'EXPANSION_SIGNAL',
          signal_text: 'India launch with new office in Bangalore',
          signal_date: new Date().toISOString().split('T')[0],
          confidence_score: 0.9,
        },
      ],
    });

    const result1 = calculateScores(input);
    const result2 = calculateScores(input);

    expect(result1).toEqual(result2);
  });
});
