import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DEADLINE_LABEL, FEE_RUPEES } from "@/lib/constants";
import "./globals.css";

const noto = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
});

const condensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-condensed",
});

const tiro = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-tiro",
});

export const metadata: Metadata = {
  title: {
    default: "Danapur Premier League 2026 — Registration",
    template: "%s · DPL 2026",
  },
  description: `Danapur Premier League cricket registration. Entry fee ₹${FEE_RUPEES}. Last date ${DEADLINE_LABEL}.`,
};

export const viewport: Viewport = {
  themeColor: "#07110c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hi" className={`${noto.variable} ${condensed.variable} ${tiro.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
