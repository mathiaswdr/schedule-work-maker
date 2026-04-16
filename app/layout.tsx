import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import WebVitalsReporter from "@/components/telemetry/web-vitals-reporter";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Kronoma",
  description: "Kronoma, time tracking and freelance invoicing.",
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
          <WebVitalsReporter locale={locale} />
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
