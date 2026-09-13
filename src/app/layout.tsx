import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "杰圆职场教育 | JY Education and Career Center",
    template: "%s | 杰圆职场教育",
  },
  description:
    "杰圆职场教育——专业的职业规划指导、简历优化与面试辅导服务。",
  metadataBase: new URL(baseUrl),
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
