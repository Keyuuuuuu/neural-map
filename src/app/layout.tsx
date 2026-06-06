import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusMind | AI 协作型个人技术脑图索引",
  description: "基于 Git 驱动与 Next.js 集中式渲染的全屏三维/二维力导向分布式技术脑图，重塑个人技术资产的组织结构。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>
        {children}
      </body>
    </html>
  );
}
