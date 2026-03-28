import type { Metadata, Viewport } from "next";
import { Inter, Lora, Noto_Sans_Gujarati } from "next/font/google";
import type { ReactNode } from "react";
import { AppChrome } from "@/components/audio/app-chrome";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { absoluteUrl } from "@/lib/metadata";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

const display = Lora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: true,
  preload: false,
});

const gujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  variable: "--font-gujarati",
  display: "swap",
  adjustFontFallback: true,
  preload: false,
});

const siteTitle = "Next Gen Bhajanavali";
const siteDescription =
  "Calm, mobile-first kirtan and bhajan lyrics in Gujarati—with Gujulish, English when available, and gentle listening.";

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: siteTitle,
    template: "%s · Bhajanavali",
  },
  description: siteDescription,
  applicationName: siteTitle,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteTitle,
    title: siteTitle,
    description: siteDescription,
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: { index: true, follow: true },
  other: {
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${gujarati.variable}`}
    >
      <body className="min-h-dvh font-sans">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <AppChrome>
          <SiteHeader />
          <main
            id="main-content"
            className="mx-auto min-h-[60vh] max-w-5xl px-4 pb-28 pt-6 sm:px-6 md:pb-10"
          >
            {children}
          </main>
          <SiteFooter />
        </AppChrome>
      </body>
    </html>
  );
}
