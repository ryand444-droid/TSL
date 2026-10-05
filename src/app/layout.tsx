import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Mono, Figtree } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700"] });
const body = Figtree({ variable: "--font-body", subsets: ["latin"] });
const mono = DM_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "TSL", template: "%s · TSL" },
  description: "Watches, cars and property saved from any site, in one list.",
  appleWebApp: { capable: true, title: "TSL", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcfa" },
    { media: "(prefers-color-scheme: dark)", color: "#18201d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
