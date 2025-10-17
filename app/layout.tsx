import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// app/layout.tsx
import FloatingContactButton from "@/components/FloatingContactButton";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'LoanFit - 住宅ローン候補検索',
  description: '住宅ローンの最適な候補を検索・比較できるシステム',
  manifest: '/manifest.json',
  themeColor: '#1f6feb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LoanFit',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        {/* Service Worker登録スクリプト*/}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('Service Worker registered successfully:', registration.scope);
                    })
                    .catch(function(registrationError) {
                      console.log('Service Worker registration failed:', registrationError);
                    });
                });
              }
            `
          }}
        /> 
        <FloatingContactButton /> {/* ← 常時表示 */}

      </body>
    </html>
  );
}