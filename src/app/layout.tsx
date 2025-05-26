import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Footer from "@/components/footer/page";

export const metadata: Metadata = {
  title: "C&L-現場管理アプリ",
  description:
    "現場の備品管理をスマートに。少人数でも確実な道具・材料管理を実現する建設現場向けチェックリストアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png"></link>
        <link rel="apple-touch-icon" sizes="180x180" href="/icon512_rounded.png" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#b8e986" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <div className="mx-auto max-w-md bg-white min-h-screen flex flex-col shadow-lg">
            {children}
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
