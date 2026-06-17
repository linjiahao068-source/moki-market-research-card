import { buildResearchReportFromCard } from '@/lib/research-report/fromResearchCard';
import type { ResearchReport } from '@/types/research-report';
import { getAllResearchCards, getResearchCardBySlug, DEFAULT_RESEARCH_CARD_SLUG } from './researchCards';

export const researchReports: ResearchReport[] = getAllResearchCards().map(buildResearchReportFromCard);

export const DEFAULT_RESEARCH_REPORT_SLUG = DEFAULT_RESEARCH_CARD_SLUG;

export function getResearchReportBySlug(slug: string) {
  const card = getResearchCardBySlug(slug);

  return card ? buildResearchReportFromCard(card) : undefined;
}

export function getAllResearchReports() {
  return researchReports;
}
