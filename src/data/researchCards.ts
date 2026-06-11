import { ResearchCard } from '@/types/research-card';
import { orclResearchCard } from './orclResearchCard';

export const researchCards: ResearchCard[] = [orclResearchCard];

export function getResearchCardBySlug(slug: string) {
  return researchCards.find((card) => card.slug === slug);
}

export function getAllResearchCards() {
  return researchCards;
}
