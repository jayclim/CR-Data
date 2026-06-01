import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Cloudflare Web Analytics beacon token. Cookieless + privacy-friendly, so no
// consent banner is required. Set NEXT_PUBLIC_CF_BEACON_TOKEN in the Vercel
// project env (create the site at dash.cloudflare.com > Web Analytics).
const cfBeaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export const metadata: Metadata = {
  title: "Clash Royale Viz",
  description: "Data visualization showcase for Clash Royale",
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
        {cfBeaconToken && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={JSON.stringify({ token: cfBeaconToken })}
          />
        )}
      </body>
    </html>
  );
}
