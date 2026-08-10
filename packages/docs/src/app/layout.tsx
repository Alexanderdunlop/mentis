import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import {
  defaultTitle,
  ogImage,
  siteDescription,
  siteKeywords,
  siteName,
  siteUrl,
} from "@/lib/metadata";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: `%s | ${siteName}`,
    default: defaultTitle,
  },
  description: siteDescription,
  keywords: siteKeywords,
  applicationName: siteName,
  authors: [
    {
      name: "Alexander Dunlop",
      url: "https://alexdunlop.com/",
    },
  ],
  creator: "Alexander Dunlop",
  openGraph: {
    type: "website",
    siteName,
    url: siteUrl,
    title: defaultTitle,
    description: siteDescription,
    locale: "en_US",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: siteDescription,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/logo/logo.png" />
        <link rel="icon" href="/logo/logo.png" />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
