import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Café Companion", template: "%s · Café Companion" },
  description: "A smarter café experience powered by Gemini: conversational ordering, honest wait times, personal picks, and a live read of the room.",
  applicationName: "Café Companion",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#2b1d14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-espresso focus:px-3 focus:py-2 focus:text-cream">
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16">
          {children}
        </main>
        <footer className="border-t border-espresso/10 py-6 text-center text-xs text-mocha">
          Café Companion · Built with Gemini, Next.js and Google Cloud · Feedback is anonymous.
        </footer>
      </body>
    </html>
  );
}
