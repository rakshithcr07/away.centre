const SUFFIXES = [
  'llc', 'ltd', 'limited', 'inc', 'incorporated', 'corp', 'corporation',
  'pvt', 'private', 'plc', 'gmbh', 'ag', 'sa', 'bv', 'oy',
  'india', 'technologies', 'technology', 'tech', 'solutions', 'services',
  'labs', 'software', 'systems', 'group', 'holdings', 'international',
];

const KNOWN_ALIASES: Record<string, string> = {
  'google india': 'google',
  'google llc': 'google',
  'alphabet': 'google',
  'amazon india': 'amazon',
  'amazon web services': 'aws',
  'microsoft india': 'microsoft',
  'flipkart internet': 'flipkart',
};

export function normalizeCompanyName(name: string): string {
  let normalized = name.toLowerCase().trim();

  for (const [alias, canonical] of Object.entries(KNOWN_ALIASES)) {
    if (normalized === alias || normalized.startsWith(alias + ' ')) {
      return canonical;
    }
  }

  normalized = normalized
    .replace(/[.,'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  for (const suffix of SUFFIXES) {
    const regex = new RegExp(`\\b${suffix}\\b`, 'gi');
    normalized = normalized.replace(regex, '').trim();
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

export function namesLikelyMatch(name1: string, name2: string): boolean {
  const n1 = normalizeCompanyName(name1);
  const n2 = normalizeCompanyName(name2);

  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;

  const words1 = new Set(n1.split(' ').filter((w) => w.length > 2));
  const words2 = new Set(n2.split(' ').filter((w) => w.length > 2));
  const intersection = [...words1].filter((w) => words2.has(w));

  return intersection.length >= 1 && intersection.length >= Math.min(words1.size, words2.size) * 0.5;
}

export function extractDomain(website: string | null): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function isValidWebsite(website: string | null): boolean {
  if (!website) return false;
  const domain = extractDomain(website);
  if (!domain) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(domain);
}
