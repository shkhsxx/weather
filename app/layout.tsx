import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Weather Atlas — 지금 지구 반대편은 어떤 하늘일까",
  description: "세계 랜드마크를 클릭하면 현지 날씨와 시간에 맞춰 배경이 바뀌는 웹 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
