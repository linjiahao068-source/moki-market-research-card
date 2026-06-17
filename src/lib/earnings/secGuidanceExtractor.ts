import type { BasicCompanyData } from '@/types/basic-data';
import type { GuidanceMetricComparison, GuidanceMetricKey } from '@/types/earnings';
import type { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import { findSecCompanyByTicker } from '@/lib/dataProviders/sec/secCompanyTickerMapper';
import { SEC_BASE_URL, secFetchJson, secFetchText } from '@/lib/dataProviders/sec/secClient';
import type { GuidanceDataResult } from './guidanceTypes';
import { getGuidanceEvidence } from './guidanceEvidenceProvider';

interface SecSubmissionsForGuidance {
  filings?: {
    recent?: {
      accessionNumber?: string[];
      filingDate?: string[];
      reportDate?: string[];
      form?: string[];
      primaryDocument?: string[];
      primaryDocDescription?: string[];
    };
  };
}

interface SecArchiveIndex {
  directory?: {
    item?: Array<{
      name?: string;
      type?: string;
      size?: number;
      'last-modified'?: string;
    }>;
  };
}

interface SecDocumentCandidate {
  accessionNumber: string;
  filingDate?: string;
  form?: string;
  reportDate?: string;
  documentName: string;
  description?: string;
  url: string;
  score: number;
}

interface GuidanceTextSection {
  candidate: SecDocumentCandidate;
  heading: string;
  text: string;
  textBlockId: string;
}

interface GuidanceAmount {
  low?: number;
  mid?: number;
  high?: number;
}

const RELEVANT_FORMS = new Set(['8-K', '10-Q', '10-K']);
const MAX_RECENT_FILINGS_TO_SCAN = 50;
const MAX_ARCHIVE_FILINGS_TO_OPEN = 8;
const MAX_DOCUMENTS_TO_PARSE = 8;

function filterSecEvidence(evidence: GlobalGuidanceEvidence[]) {
  return evidence.filter((item) => item.source === 'sec-edgar' || item.evidenceType === 'sec-filing');
}

function buildSourceLinkEvidence(
  ticker: string,
  basicData?: BasicCompanyData
): GlobalGuidanceEvidence[] {
  if (!basicData?.sourceLinks || !basicData.latestFiling) {
    return [];
  }

  return basicData.sourceLinks
    .filter((link) => {
      const label = link.label.toLowerCase();
      return label.includes('8-k') || label.includes('earnings') || label.includes('filing');
    })
    .map((link) => ({
      symbol: ticker,
      title: link.label,
      source: 'sec-edgar' as const,
      url: link.url,
      publishedAt: basicData.latestFiling?.filingDate,
      snippet: `${link.label} may contain management commentary or forward-looking statements.`,
      evidenceType: 'sec-filing' as const,
      extracted: false,
      confidence: 0.25,
      warnings: ['SEC filing linked as evidence; structured guidance values require source review.'],
    }));
}

function getCikWithoutLeadingZeros(cik: string) {
  return String(Number(cik));
}

function getAccessionWithoutDashes(accessionNumber: string) {
  return accessionNumber.replace(/-/g, '');
}

function buildArchiveBaseUrl(cik: string, accessionNumber: string) {
  return `https://www.sec.gov/Archives/edgar/data/${getCikWithoutLeadingZeros(cik)}/${getAccessionWithoutDashes(accessionNumber)}`;
}

function buildArchiveDocumentUrl(cik: string, accessionNumber: string, documentName: string) {
  return `${buildArchiveBaseUrl(cik, accessionNumber)}/${documentName}`;
}

function isHtmlDocumentName(name?: string) {
  if (!name) {
    return false;
  }

  const normalizedName = name.toLowerCase();

  return (
    (normalizedName.endsWith('.htm') || normalizedName.endsWith('.html') || normalizedName.endsWith('.txt')) &&
    !normalizedName.includes('_cal.') &&
    !normalizedName.includes('_def.') &&
    !normalizedName.includes('_lab.') &&
    !normalizedName.includes('_pre.') &&
    !normalizedName.includes('_htm.xml') &&
    !normalizedName.endsWith('.xsd')
  );
}

function scoreDocumentCandidate(input: {
  form?: string;
  documentName: string;
  description?: string;
  primaryDocument?: string;
}) {
  const normalized = `${input.documentName} ${input.description ?? ''}`.toLowerCase();
  let score = 0;

  if (input.form === '8-K') {
    score += 35;
  } else if (input.form === '10-Q') {
    score += 16;
  } else if (input.form === '10-K') {
    score += 8;
  }

  if (input.primaryDocument && input.documentName === input.primaryDocument) {
    score += 4;
  }

  if (normalized.includes('ex-99') || normalized.includes('ex99') || normalized.includes('exhibit99')) {
    score += 70;
  }

  if (/(earnings|result|release|press|outlook|guidance|financial)/i.test(normalized)) {
    score += 42;
  }

  if (/(q[1-4]fy|fy\d{2}|pr\.htm|pr\.html)/i.test(normalized)) {
    score += 28;
  }

  if (/(xbrl|xml|schema|cover|index)/i.test(normalized)) {
    score -= 35;
  }

  return score;
}

async function discoverSecGuidanceDocuments(symbol: string): Promise<{
  candidates: SecDocumentCandidate[];
  warnings: string[];
}> {
  const match = await findSecCompanyByTicker(symbol);

  if (!match) {
    return {
      candidates: [],
      warnings: ['SEC CIK was not found for this ticker.'],
    };
  }

  const warnings: string[] = [];
  const submissions = await secFetchJson<SecSubmissionsForGuidance>(`${SEC_BASE_URL}/submissions/CIK${match.cik}.json`);
  const recent = submissions.filings?.recent;
  const forms = recent?.form ?? [];
  const candidatesByUrl = new Map<string, SecDocumentCandidate>();
  let archiveFilingsOpened = 0;

  for (
    let index = 0;
    index < forms.length && index < MAX_RECENT_FILINGS_TO_SCAN && archiveFilingsOpened < MAX_ARCHIVE_FILINGS_TO_OPEN;
    index += 1
  ) {
    const form = forms[index];

    if (!form || !RELEVANT_FORMS.has(form)) {
      continue;
    }

    const accessionNumber = recent?.accessionNumber?.[index];
    const primaryDocument = recent?.primaryDocument?.[index];

    if (!accessionNumber) {
      continue;
    }

    const filingDate = recent?.filingDate?.[index];
    const reportDate = recent?.reportDate?.[index];
    const description = recent?.primaryDocDescription?.[index];
    const baseCandidate = {
      accessionNumber,
      filingDate,
      form,
      reportDate,
      description,
    };

    archiveFilingsOpened += 1;

    if (primaryDocument && isHtmlDocumentName(primaryDocument)) {
      const url = buildArchiveDocumentUrl(match.cik, accessionNumber, primaryDocument);
      candidatesByUrl.set(url, {
        ...baseCandidate,
        documentName: primaryDocument,
        url,
        score: scoreDocumentCandidate({ form, documentName: primaryDocument, description, primaryDocument }),
      });
    }

    const indexUrl = `${buildArchiveBaseUrl(match.cik, accessionNumber)}/index.json`;
    const archiveIndex = await secFetchJson<SecArchiveIndex>(indexUrl).catch((error) => {
      warnings.push(
        `SEC archive index skipped for ${accessionNumber}: ${
          error instanceof Error ? error.message : 'request failed'
        }`
      );
      return undefined;
    });

    for (const item of archiveIndex?.directory?.item ?? []) {
      const documentName = item.name;

      if (!documentName || !isHtmlDocumentName(documentName)) {
        continue;
      }

      const url = buildArchiveDocumentUrl(match.cik, accessionNumber, documentName);
      candidatesByUrl.set(url, {
        ...baseCandidate,
        documentName,
        url,
        score: scoreDocumentCandidate({ form, documentName, description, primaryDocument }),
      });
    }
  }

  const candidates = Array.from(candidatesByUrl.values())
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_DOCUMENTS_TO_PARSE);

  if (candidates.length === 0) {
    warnings.push('SEC filings were found, but no likely earnings release or guidance exhibit document was identified.');
  }

  return {
    candidates,
    warnings,
  };
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: '&',
    apos: "'",
    bull: ' ',
    ldquo: '"',
    lsquo: "'",
    mdash: ' ',
    nbsp: ' ',
    ndash: ' ',
    quot: '"',
    rdquo: '"',
    rsquo: "'",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const normalizedEntity = entity.toLowerCase();

    if (normalizedEntity.startsWith('#x')) {
      const codePoint = Number.parseInt(normalizedEntity.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCharCode(codePoint) : match;
    }

    if (normalizedEntity.startsWith('#')) {
      const codePoint = Number.parseInt(normalizedEntity.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCharCode(codePoint) : match;
    }

    return namedEntities[normalizedEntity] ?? match;
  });
}

function htmlToText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|div|li|tr|table|h1|h2|h3|h4|h5|h6)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\u00a0/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitCleanLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isGuidanceHeading(line: string) {
  const normalized = line.toLowerCase();

  if (normalized.length > 120) {
    return false;
  }

  return (
    /^(outlook|business outlook|financial outlook|guidance|financial guidance|current prospects)$/i.test(line) ||
    /(outlook|guidance).{0,60}(quarter|fiscal|year|financial)/i.test(line)
  );
}

function isGuidanceStopHeading(line: string) {
  const normalized = line.toLowerCase();

  if (normalized.length > 120) {
    return false;
  }

  return /^(highlights|conference call|webcast|non-gaap|about |contacts?|condensed consolidated|reconciliation|forward-looking|safe harbor|###|\* \* \*)/i.test(normalized);
}

function hasGuidanceLanguage(line: string) {
  return /(expected to be|expects|expecting|outlook|guidance|forecast|projected|plus or minus)/i.test(line);
}

function extractGuidanceSections(candidate: SecDocumentCandidate, documentText: string): GuidanceTextSection[] {
  const lines = splitCleanLines(documentText);
  const sections: GuidanceTextSection[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!isGuidanceHeading(lines[index])) {
      continue;
    }

    let endIndex = index + 1;

    while (endIndex < lines.length && endIndex < index + 26) {
      if (endIndex > index + 2 && isGuidanceStopHeading(lines[endIndex])) {
        break;
      }
      endIndex += 1;
    }

    const sectionLines = lines.slice(index, endIndex);
    const sectionText = sectionLines.join('\n');

    if (sectionText.length > 40) {
      sections.push({
        candidate,
        heading: lines[index],
        text: sectionText,
        textBlockId: `${candidate.accessionNumber}:${candidate.documentName}:${index}`,
      });
    }
  }

  if (sections.length > 0) {
    return sections;
  }

  const guidanceLines = lines.filter((line) => {
    const normalized = line.toLowerCase();
    return (
      hasGuidanceLanguage(line) &&
      (normalized.includes('revenue') ||
        normalized.includes('earnings per share') ||
        normalized.includes('eps') ||
        normalized.includes('gross margin') ||
        normalized.includes('operating expenses'))
    );
  });

  if (guidanceLines.length === 0) {
    return [];
  }

  return [
    {
      candidate,
      heading: 'Guidance-related statements',
      text: guidanceLines.slice(0, 10).join('\n'),
      textBlockId: `${candidate.accessionNumber}:${candidate.documentName}:keyword-window`,
    },
  ];
}

function splitSentences(text: string) {
  return text
    .replace(/\r?\n/g, '. ')
    .split(/(?:\.|\u2022|;)\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function parseNumber(value: string) {
  return Number(value.replace(/,/g, ''));
}

function scaleMoneyValue(value: number, unit?: string) {
  const normalizedUnit = unit?.toLowerCase();

  if (normalizedUnit === 'billion' || normalizedUnit === 'bn') {
    return value * 1_000_000_000;
  }

  if (normalizedUnit === 'million' || normalizedUnit === 'm') {
    return value * 1_000_000;
  }

  return value;
}

function getUnitPattern() {
  return '(billion|million|bn|m)?';
}

function extractDollarAmount(sentence: string, scaleLargeUnits: boolean): GuidanceAmount | undefined {
  const unitPattern = getUnitPattern();
  const rangePattern = new RegExp(
    `(?:between|range of|from)\\s+(?:\\$|US\\$)?\\s*([\\d,.]+)\\s*${unitPattern}\\s+(?:and|to|[-\\u2013\\u2014])\\s+(?:\\$|US\\$)?\\s*([\\d,.]+)\\s*${unitPattern}`,
    'i'
  );
  const rangeMatch = sentence.match(rangePattern);

  if (rangeMatch) {
    const lowUnit = rangeMatch[2] || rangeMatch[4];
    const highUnit = rangeMatch[4] || rangeMatch[2];
    const low = scaleLargeUnits ? scaleMoneyValue(parseNumber(rangeMatch[1]), lowUnit) : parseNumber(rangeMatch[1]);
    const high = scaleLargeUnits ? scaleMoneyValue(parseNumber(rangeMatch[3]), highUnit) : parseNumber(rangeMatch[3]);

    return {
      low,
      mid: (low + high) / 2,
      high,
    };
  }

  const singlePattern = new RegExp(`(?:\\$|US\\$)\\s*([\\d,.]+)\\s*${unitPattern}`, 'i');
  const singleMatch = sentence.match(singlePattern);

  if (!singleMatch) {
    return undefined;
  }

  const mid = scaleLargeUnits ? scaleMoneyValue(parseNumber(singleMatch[1]), singleMatch[2]) : parseNumber(singleMatch[1]);
  const plusMinusPctMatch = sentence.match(/(?:plus\s+or\s+minus|\+\/-)\s*([\d.]+)\s*%/i);

  if (plusMinusPctMatch) {
    const pct = parseNumber(plusMinusPctMatch[1]) / 100;
    return {
      low: mid * (1 - pct),
      mid,
      high: mid * (1 + pct),
    };
  }

  return { mid };
}

function inferPeriodLabel(text: string) {
  const normalizedText = text.replace(/\s+/g, ' ');
  const quarterMatch = normalizedText.match(
    /(first|second|third|fourth)\s+quarter(?:\s+of)?(?:\s+fiscal)?\s+(\d{4}|\d{2})/i
  );

  if (quarterMatch) {
    return `${quarterMatch[1][0].toUpperCase()}${quarterMatch[1].slice(1).toLowerCase()} quarter fiscal ${quarterMatch[2]}`;
  }

  const fullYearMatch = normalizedText.match(/full\s+year(?:\s+fiscal)?\s+(\d{4}|\d{2})/i);

  if (fullYearMatch) {
    return `Full year fiscal ${fullYearMatch[1]}`;
  }

  return undefined;
}

function hasFutureGuidanceContext(sentence: string) {
  return /(expected|expects|expecting|outlook|guidance|forecast|projected|plus or minus|approximately)/i.test(sentence);
}

function createGuidanceMetric(input: {
  metricKey: GuidanceMetricKey;
  label: string;
  amount: GuidanceAmount;
  periodLabel?: string;
  evidenceText: string;
  sourceUrl: string;
}): GuidanceMetricComparison {
  return {
    metricKey: input.metricKey,
    label: input.label,
    guidanceLow: input.amount.low,
    guidanceMid: input.amount.mid,
    guidanceHigh: input.amount.high,
    periodLabel: input.periodLabel,
    source: 'sec-edgar',
    quality: 'extracted',
    evidenceText: input.evidenceText,
    sourceUrl: input.sourceUrl,
    warnings: [],
  };
}

function parseGuidanceMetricsFromSection(section: GuidanceTextSection): GuidanceMetricComparison[] {
  const metrics = new Map<GuidanceMetricKey, GuidanceMetricComparison>();
  const sentences = splitSentences(section.text);
  const sectionPeriodLabel = inferPeriodLabel(section.text);

  for (const sentence of sentences) {
    const normalizedSentence = sentence.toLowerCase();

    if (!hasFutureGuidanceContext(sentence)) {
      continue;
    }

    if (normalizedSentence.includes('revenue')) {
      const amount = extractDollarAmount(sentence, true);

      if (amount) {
        const periodLabel = inferPeriodLabel(sentence) ?? sectionPeriodLabel;
        const isFullYear = /full\s+year/i.test(`${periodLabel ?? ''} ${sentence}`);
        const metricKey: GuidanceMetricKey = isFullYear ? 'fullYearRevenue' : 'nextQuarterRevenue';

        if (!metrics.has(metricKey)) {
          metrics.set(
            metricKey,
            createGuidanceMetric({
              metricKey,
              label: isFullYear ? 'Full year revenue guidance' : 'Next quarter revenue guidance',
              amount,
              periodLabel,
              evidenceText: sentence,
              sourceUrl: section.candidate.url,
            })
          );
        }
      }
    }

    if (/(earnings per share|diluted earnings per share|\beps\b)/i.test(sentence)) {
      const amount = extractDollarAmount(sentence, false);

      if (amount) {
        const periodLabel = inferPeriodLabel(sentence) ?? sectionPeriodLabel;
        const isFullYear = /full\s+year/i.test(`${periodLabel ?? ''} ${sentence}`);
        const metricKey: GuidanceMetricKey = isFullYear ? 'fullYearEps' : 'nextQuarterEps';

        if (!metrics.has(metricKey)) {
          metrics.set(
            metricKey,
            createGuidanceMetric({
              metricKey,
              label: isFullYear ? 'Full year EPS guidance' : 'Next quarter EPS guidance',
              amount,
              periodLabel,
              evidenceText: sentence,
              sourceUrl: section.candidate.url,
            })
          );
        }
      }
    }
  }

  return Array.from(metrics.values());
}

function compactSnippet(text: string, maxLength = 700) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function buildEvidenceFromSection(symbol: string, section: GuidanceTextSection): GlobalGuidanceEvidence {
  return {
    symbol,
    title: `${section.candidate.form ?? 'SEC'} ${section.heading}`,
    source: 'sec-edgar',
    url: section.candidate.url,
    publishedAt: section.candidate.filingDate,
    snippet: compactSnippet(section.text),
    evidenceType: 'sec-filing',
    extracted: true,
    filingAccession: section.candidate.accessionNumber,
    documentType: section.candidate.documentName,
    confidence: 0.75,
    textBlockId: section.textBlockId,
    warnings: [],
  };
}

function dedupeGuidanceMetrics(metrics: GuidanceMetricComparison[]) {
  const byKey = new Map<GuidanceMetricKey, GuidanceMetricComparison>();

  for (const metric of metrics) {
    if (!byKey.has(metric.metricKey)) {
      byKey.set(metric.metricKey, metric);
    }
  }

  return Array.from(byKey.values());
}

function uniqueWarnings(warnings: string[]) {
  return [...new Set(warnings.filter(Boolean))];
}

export async function extractGuidanceFromSec(
  ticker: string,
  basicData?: BasicCompanyData,
  evidenceInput?: GlobalGuidanceEvidence[]
): Promise<GuidanceDataResult> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const lookup = evidenceInput
    ? { evidence: evidenceInput, warnings: [] as string[] }
    : await getGuidanceEvidence(normalizedTicker);
  const linkedEvidence = [
    ...filterSecEvidence(lookup.evidence),
    ...buildSourceLinkEvidence(normalizedTicker, basicData),
  ];
  const warnings = [...lookup.warnings.filter((warning) => warning.toLowerCase().includes('sec'))];

  let candidates: SecDocumentCandidate[] = [];

  try {
    const discovery = await discoverSecGuidanceDocuments(normalizedTicker);
    candidates = discovery.candidates;
    warnings.push(...discovery.warnings);
  } catch (error) {
    warnings.push(`SEC guidance document discovery failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  const extractedEvidence: GlobalGuidanceEvidence[] = [];
  const extractedGuidance: GuidanceMetricComparison[] = [];

  for (const candidate of candidates) {
    const documentHtml = await secFetchText(candidate.url).catch((error) => {
      warnings.push(
        `SEC guidance document skipped (${candidate.documentName}): ${
          error instanceof Error ? error.message : 'request failed'
        }`
      );
      return undefined;
    });

    if (!documentHtml) {
      continue;
    }

    const sections = extractGuidanceSections(candidate, htmlToText(documentHtml));

    for (const section of sections) {
      extractedEvidence.push(buildEvidenceFromSection(normalizedTicker, section));
      extractedGuidance.push(...parseGuidanceMetricsFromSection(section));
    }

    if (extractedGuidance.length > 0) {
      break;
    }
  }

  const guidance = dedupeGuidanceMetrics(extractedGuidance);
  const guidanceEvidence = [...extractedEvidence, ...linkedEvidence];
  const source = guidance.length > 0
    ? 'SEC EDGAR exhibit guidance'
    : guidanceEvidence.length > 0
      ? 'SEC EDGAR evidence'
      : 'SEC EDGAR';

  if (guidance.length > 0) {
    warnings.push(`SEC exhibit guidance extracted from ${extractedEvidence.length} text block(s).`);
  } else if (extractedEvidence.length > 0) {
    warnings.push('SEC guidance text evidence was found, but no supported revenue or EPS guidance number was extracted.');
  } else if (candidates.length > 0) {
    warnings.push('SEC candidate documents were checked, but no Outlook or guidance section was found.');
  } else {
    warnings.push('SEC filing evidence was not found for this symbol.');
  }

  const confidence = guidance.length > 0
    ? Math.min(0.9, 0.62 + guidance.length * 0.08)
    : guidanceEvidence.length > 0
      ? 0.35
      : 0;

  return {
    guidance,
    guidanceEvidence,
    source,
    confidence,
    warnings: uniqueWarnings(warnings),
  };
}
