import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600"] });
const body = Jost({ variable: "--font-body", subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata: Metadata = {
  title: { default: "TSL", template: "%s · TSL" },
  description: "Watches, cars and property saved from any site, in one list.",
  appleWebApp: { capable: true, title: "TSL", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0e0f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
