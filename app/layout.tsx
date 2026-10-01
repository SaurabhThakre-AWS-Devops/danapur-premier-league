import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Noto_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DEADLINE_LABEL, FEE_RUPEES } from "@/lib/constants";
import "./globals.css";

const noto = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
});

const condensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-condensed",
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
    <html lang="en" className={`${noto.variable} ${condensed.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {process.env.NEXT_PUBLIC_STATIC_HOST === "true" ? (
          <p className="bg-[#c4a15a] px-4 py-2 text-center text-sm font-semibold text-[#17241c]">
            This GitHub page shows the form and the PhonePe QR. Player names are saved only on the registration server.
          </p>
        ) : null}
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
