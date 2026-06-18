import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResearchCard } from '@/components/ResearchCard';
import { getAllResearchCards, getResearchCardBySlug } from '@/data/researchCards';
import { getResearchReportBySlug } from '@/data/researchReports';

interface ResearchCardDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return getAllResearchCards().map((card) => ({
    slug: card.slug,
  }));
}

export async function generateMetadata({ params }: ResearchCardDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = getResearchCardBySlug(slug);

  if (!card) {
    return {
      title: "研究卡未找到",
    };
  }

  return {
    title: `${card.title}｜Moki Market`,
    description: "一个静态研究卡案例，展示 Moki Market 如何把市场噪音转成摘要、舆情、基本面、事件、证据链和下一步研究任务。",
    openGraph: {
      title: `${card.title}｜Moki Market`,
      description: "一个静态研究卡案例，展示 Moki Market 如何把市场噪音转成摘要、舆情、基本面、事件、证据链和下一步研究任务。",
    },
    twitter: {
      title: `${card.title}｜Moki Market`,
      description: "一个静态研究卡案例，展示 Moki Market 如何把市场噪音转成摘要、舆情、基本面、事件、证据链和下一步研究任务。",
    },
  };
}

export default async function ResearchCardDetailPage({ params }: ResearchCardDetailPageProps) {
  const { slug } = await params;
  const card = getResearchCardBySlug(slug);

  if (!card) {
    notFound();
  }

  const report = getResearchReportBySlug(slug);

  return <ResearchCard card={card} report={report} />;
}
