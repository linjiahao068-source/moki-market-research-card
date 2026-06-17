import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Moki Market｜Executive Investment View",
    template: "%s｜Moki Market",
  },
  description: "把财报、公司指引、产业链线索、市场叙事和证据来源整理成可追踪、可复盘的研究报告视图。",
  openGraph: {
    title: "Moki Market｜Executive Investment View",
    description: "把财报、公司指引、产业链线索、市场叙事和证据来源整理成可追踪、可复盘的研究报告视图。",
    type: "website",
    locale: "zh_CN",
    siteName: "Moki Market",
  },
  twitter: {
    card: "summary",
    title: "Moki Market｜Executive Investment View",
    description: "把财报、公司指引、产业链线索、市场叙事和证据来源整理成可追踪、可复盘的研究报告视图。",
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
