import type { Metadata } from "next";
import { orclResearchCard } from '@/data/orclResearchCard';
import { ResearchCard } from '@/components/ResearchCard';

export const metadata: Metadata = {
  title: "ORCL AI 云收入兑现研究卡",
  description: "一个静态研究卡案例，展示 Moki Market 如何把市场噪音转成摘要、舆情、基本面、事件、证据链和下一步研究任务。",
  openGraph: {
    title: "ORCL AI 云收入兑现研究卡｜Moki Market",
    description: "一个静态研究卡案例，展示 Moki Market 如何把市场噪音转成摘要、舆情、基本面、事件、证据链和下一步研究任务。",
  },
  twitter: {
    title: "ORCL AI 云收入兑现研究卡｜Moki Market",
    description: "一个静态研究卡案例，展示 Moki Market 如何把市场噪音转成摘要、舆情、基本面、事件、证据链和下一步研究任务。",
  },
};

export default function ResearchCardPage() {
  return <ResearchCard card={orclResearchCard} />;
}
