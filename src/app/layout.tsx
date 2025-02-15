import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "C&L-現場管理アプリ",
  description: "現場の備品管理をスマートに。少人数でも確実な道具・材料管理を実現する建設現場向けチェックリストアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
