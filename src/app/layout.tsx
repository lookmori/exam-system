import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "奇幻课堂 - 在线考试系统",
  description: "让考试变成一场奇妙的冒险之旅",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 text-slate-700">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
