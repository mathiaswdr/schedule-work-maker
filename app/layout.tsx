import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import WebVitalsReporter from "@/components/telemetry/web-vitals-reporter";
import { getSiteUrl } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const shouldReportWebVitals =
  process.env.NODE_ENV === "production" ||
  process.env.WEB_VITALS_ENABLED === "true";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: "Kronoma",
  description:
    "Kronoma est un logiciel suisse de suivi du temps pour freelances qui transforme vos heures en factures avec QR-facture suisse.",
  applicationName: "Kronoma",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "fr_CH",
    siteName: "Kronoma",
    title: "Kronoma",
    description:
      "Kronoma est un logiciel suisse de suivi du temps pour freelances qui transforme vos heures en factures avec QR-facture suisse.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronoma",
    description:
      "Kronoma est un logiciel suisse de suivi du temps pour freelances qui transforme vos heures en factures avec QR-facture suisse.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kronoma",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1b16" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="" suppressHydrationWarning>
      <body className={`min-h-screen bg-paper text-ink ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {shouldReportWebVitals ? <WebVitalsReporter locale={locale} /> : null}
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
