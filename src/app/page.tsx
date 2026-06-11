'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[oklch(0.975_0.008_220)] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[oklch(0.35_0.08_220)] flex items-center justify-center shadow-[0_4px_15px_-6px_rgba(0,0,0,0.3)]">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <h1 className="text-2xl font-bold text-[oklch(0.25_0.02_220)] tracking-tight">
              Moki Market
            </h1>
          </div>
          <p className="text-lg text-[oklch(0.45_0.05_220)] font-medium mb-2">
            AI 时代中文美股用户的信息焦虑解读器
          </p>
        </div>

        {/* 说明卡片 */}
        <div className="bg-white rounded-2xl border border-[oklch(0.9_0.01_220)] shadow-[0_4px_24px_-10px_rgba(0,0,0,0.08)] p-6 mb-6">
          <p className="text-[oklch(0.35_0.05_220)] leading-relaxed text-base">
            把 X 舆情、英文新闻、财报线索、AI 产业链变化和市场波动，整理成可读、可追踪、可复盘的研究卡。
          </p>
        </div>

        {/* 按钮 */}
        <div className="text-center mb-8">
          <Link
            href="/research-card/orcl-ai-cloud"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[oklch(0.35_0.08_220)] text-white rounded-xl font-medium shadow-[0_4px_15px_-6px_rgba(0,0,0,0.3)] hover:bg-[oklch(0.32_0.08_220)] transition-colors"
          >
            查看 ORCL 研究卡案例
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* 免责声明 */}
        <p className="text-center text-xs text-[oklch(0.55_0.03_220)] leading-relaxed">
          仅供信息整理、研究辅助和教育参考，不构成投资建议。
        </p>
      </div>
    </div>
  );
}
