import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "面接シミュレーション",
  description: "AI面接シミュレーション - 介護施設の面接練習",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
