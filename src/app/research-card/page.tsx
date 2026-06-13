import { redirect } from "next/navigation";
import { DEFAULT_RESEARCH_CARD_SLUG } from '@/data/researchCards';

export default function ResearchCardPage() {
  redirect(`/research-card/${DEFAULT_RESEARCH_CARD_SLUG}`);
}
