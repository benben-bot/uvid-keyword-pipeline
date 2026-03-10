import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UVID 선케어 키워드 디스커버리",
  description: "유비드(UVID) 선케어 브랜드 키워드 발굴 자동화 툴",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
