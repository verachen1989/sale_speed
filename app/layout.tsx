import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./grand.css";
import "./vision-cockpit.css";
import "./annual-overview.css";
import "./map-integrated-overview.css";
import { publicAssetPath } from "./public-path";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://verachen1989.github.io/sale_speed/";
const imageUrl = `${siteUrl}og.png`;
const title = "绿城中国经营工作台";
const description = "面向展馆展示的地图融合经营工作台，分层呈现投资、建设、交付、销售、持有经营、特色业务与土地储备指标。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: siteUrl },
  icons: {
    icon: [{ url: publicAssetPath("/favicon.svg"), type: "image/svg+xml" }],
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: siteUrl,
    images: [{ url: imageUrl, width: 1730, height: 909, alt: "绿城中国地图融合经营工作台" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [imageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="preload"
          href={publicAssetPath("/china-geo.json")}
          as="fetch"
          crossOrigin="anonymous"
        />
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
