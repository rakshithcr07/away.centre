import { chromium } from 'playwright';
import { logger } from '../../utils/logger';

export interface CareerCheckResult {
  isHiring: boolean;
  pageFound: boolean;
  signalText: string | null;
}

/**
 * Checks a company's website to see if they are hiring.
 * Uses Playwright with a fallback to lightweight HTTP fetch if browser binaries are not installed.
 */
export async function checkCareerPage(websiteUrl: string): Promise<CareerCheckResult> {
  if (!websiteUrl || !websiteUrl.startsWith('http')) {
    return { isHiring: false, pageFound: false, signalText: null };
  }

  // 1. Playwright Web Browser Scraper (best results)
  try {
    logger.info(`Scraping website via Playwright: ${websiteUrl}`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // 5 second timeout limit for speed
    await page.goto(websiteUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });

    // Extract links
    const links = await page.$$eval('a', (elements) =>
      elements.map((el) => ({
        text: el.textContent || '',
        href: el.getAttribute('href') || '',
      }))
    );

    const careerKeywords = ['career', 'job', 'hiring', 'work-with-us', 'join-us', 'join us', 'opening', 'recruit'];
    const careerLink = links.find((l) => {
      const hrefLower = l.href.toLowerCase();
      const textLower = l.text.toLowerCase();
      return careerKeywords.some((kw) => hrefLower.includes(kw) || textLower.includes(kw));
    });

    if (careerLink) {
      let careerUrl = careerLink.href;
      if (!careerUrl.startsWith('http')) {
        careerUrl = new URL(careerUrl, websiteUrl).toString();
      }

      logger.info(`Playwright: navigating to detected careers page: ${careerUrl}`);
      await page.goto(careerUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });

      const pageText = await page.evaluate(() => document.body.innerText || '');
      const hiringKeywords = [
        'open role', 'join our team', 'we are hiring', 'current opening', 'apply now',
        'software engineer', 'office manager', 'sales representative', 'customer support',
        'hr manager', 'operations specialist'
      ];
      const isHiring = hiringKeywords.some((kw) => pageText.toLowerCase().includes(kw));

      await browser.close();
      return {
        isHiring,
        pageFound: true,
        signalText: isHiring ? `Active jobs found on website careers page: ${careerUrl}` : null,
      };
    }

    await browser.close();
  } catch (err: any) {
    logger.warn(`Playwright scrape failed (likely browser binaries are not installed). Falling back to HTTP.`, {
      error: err.message,
    });
  }

  // 2. Lightweight HTTP Regex Crawler (no installation dependencies)
  try {
    logger.info(`HTTP Fallback: crawling page via fetch: ${websiteUrl}`);
    const res = await fetch(websiteUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      return { isHiring: false, pageFound: false, signalText: null };
    }

    const html = await res.text();
    // Look for career-like href links in the HTML
    const hrefRegex = /href=["']([^"']*(?:career|job|hiring|work-with-us|join-us|joinus)[^"']*)["']/gi;
    const matches = [...html.matchAll(hrefRegex)];

    if (matches.length > 0) {
      let careerUrl = matches[0][1];
      if (!careerUrl.startsWith('http')) {
        careerUrl = new URL(careerUrl, websiteUrl).toString();
      }

      logger.info(`HTTP Fallback: checking careers sub-page: ${careerUrl}`);
      const careerRes = await fetch(careerUrl, { signal: AbortSignal.timeout(5000) });
      if (careerRes.ok) {
        const careerHtml = await careerRes.text();
        const lowerHtml = careerHtml.toLowerCase();
        const hiringKeywords = [
          'open role', 'join our team', 'we are hiring', 'current opening', 'apply now',
          'software engineer', 'office manager', 'sales', 'support', 'recruiting'
        ];
        const isHiring = hiringKeywords.some((kw) => lowerHtml.includes(kw));
        return {
          isHiring,
          pageFound: true,
          signalText: isHiring ? `Active jobs found on website careers page: ${careerUrl}` : null,
        };
      }
    }
  } catch (err: any) {
    logger.error(`HTTP fallback crawling failed for ${websiteUrl}:`, { error: err.message });
  }

  return { isHiring: false, pageFound: false, signalText: null };
}
