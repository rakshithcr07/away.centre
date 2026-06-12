import { logger } from '../../utils/logger';
import type { SignalSource, SignalType } from '@away/shared';

export interface RawSignalInput {
  source: SignalSource;
  companyName: string;
  signalType: SignalType;
  signalText: string;
  signalDate: string;
  confidenceScore: number;
  website?: string;
  city?: string;
  industry?: string;
  employeeCount?: number;
  linkedinUrl?: string;
}

function cleanXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

export async function fetchGoogleNewsSignals(): Promise<RawSignalInput[]> {
  const cities = ['Bangalore', 'Vizag', 'Kolkata'];
  const keywords = ['funding raised', 'office expansion', 'new office', 'hiring team'];
  const signals: RawSignalInput[] = [];

  for (const city of cities) {
    for (const kw of keywords) {
      const queryStr = encodeURIComponent(`${kw} ${city}`);
      const url = `https://news.google.com/rss/search?q=${queryStr}&hl=en-IN&gl=IN&ceid=IN:en`;

      try {
        logger.info(`Fetching Google News RSS for query: "${kw} ${city}"...`);
        const response = await fetch(url);
        if (!response.ok) {
          logger.warn(`Failed to fetch Google News RSS for ${kw} ${city}: ${response.status}`);
          continue;
        }

        const xml = await response.text();
        // Extract items using regex
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

        // Parse top 3 items per query to avoid noise
        for (const item of items.slice(0, 3)) {
          const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
          const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

          if (!titleMatch) continue;

          const rawTitle = cleanXmlEntities(titleMatch[1]);
          const pubDateStr = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
          const signalDate = new Date(pubDateStr).toISOString().split('T')[0];

          // Clean title: remove news publisher suffix
          const cleanTitle = rawTitle.split(' - ')[0];

          // Heuristic to extract company name before a verb
          const verbs = [
            'raises', 'raised', 'opens', 'opened', 'to hire', 'hiring', 
            'expands', 'expanded', 'announces', 'announced', 'secures', 
            'secured', 'gets', 'plans', 'signs', 'signed', 'launches', 'launched'
          ];
          let companyName = '';
          const lowerTitle = cleanTitle.toLowerCase();

          for (const verb of verbs) {
            const idx = lowerTitle.indexOf(` ${verb} `);
            if (idx > 0) {
              companyName = cleanTitle.substring(0, idx).trim();
              break;
            }
          }

          // Fallback if no verb matches: take the first two words
          if (!companyName) {
            const words = cleanTitle.split(/\s+/);
            companyName = words.slice(0, Math.min(words.length, 2)).join(' ');
          }

          // Clean and format company name
          companyName = companyName
            .replace(/^(hiring|funding|startup|expansion|how|why|what|when|new|local|exclusive)\s+/i, '')
            .replace(/[^\w\s-]/g, '')
            .trim();

          // Exclude noise, cities, and common generic nouns
          const lowerComp = companyName.toLowerCase();
          const skipList = [
            'india', 'bangalore', 'kolkata', 'chennai', 'mumbai', 'delhi', 
            'startup', 'coworking', 'office', 'workspace', 'hiring', 'funding', 
            'expansion', 'new', 'tech', 'software'
          ];
          if (companyName.length < 3 || skipList.some(w => lowerComp.includes(w))) {
            continue;
          }

          // Determine signal type
          let signalType: SignalType = 'EXPANSION_SIGNAL';
          if (lowerTitle.includes('funding') || lowerTitle.includes('raises') || lowerTitle.includes('valuation') || lowerTitle.includes('capital')) {
            signalType = 'FUNDING_SIGNAL';
          } else if (lowerTitle.includes('hiring') || lowerTitle.includes('hire') || lowerTitle.includes('jobs')) {
            signalType = 'HIRING_SIGNAL';
          }

          signals.push({
            source: 'news_api',
            companyName,
            signalType,
            signalText: cleanTitle,
            signalDate,
            confidenceScore: 0.85,
            city,
            website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
            industry: 'Tech',
            employeeCount: 50,
          });
        }
      } catch (err: any) {
        logger.error(`Error collecting Google News RSS for ${kw} ${city}:`, { error: err.message });
      }
    }
  }

  logger.info(`Google News RSS collection completed: gathered ${signals.length} raw signals`);
  return signals;
}
