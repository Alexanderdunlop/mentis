import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | mentis",
    default: "mentis",
  },
  description: "A small, fast, and flexible mention input solution for React.",
  authors: [
    {
      name: "Alexander Dunlop",
      url: "https://alexdunlop.com/",
    },
  ],
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
