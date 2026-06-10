import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Moki Market｜AI 时代中文美股用户的信息焦虑解读器",
    template: "%s｜Moki Market",
  },
  description: "把 X 舆情、英文新闻、财报线索、AI 产业链变化和市场波动，整理成可读、可追踪、可复盘的研究卡。",
  openGraph: {
    title: "Moki Market｜AI 时代中文美股用户的信息焦虑解读器",
    description: "把 X 舆情、英文新闻、财报线索、AI 产业链变化和市场波动，整理成可读、可追踪、可复盘的研究卡。",
    type: "website",
    locale: "zh_CN",
    siteName: "Moki Market",
  },
  twitter: {
    card: "summary",
    title: "Moki Market｜AI 时代中文美股用户的信息焦虑解读器",
    description: "把 X 舆情、英文新闻、财报线索、AI 产业链变化和市场波动，整理成可读、可追踪、可复盘的研究卡。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
