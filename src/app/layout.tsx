import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moki Market Research Card",
  description: "Moki Market - 中文美股用户的信息焦虑解读器",
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
