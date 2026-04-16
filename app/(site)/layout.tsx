import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Nav from "@/components/navigation/nav";
import Footer from "@/components/footer/footer";
import { pickMessages } from "@/lib/i18n";

const SITE_MESSAGE_NAMESPACES = ["nav", "footer", "auth"] as const;

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={pickMessages(messages, SITE_MESSAGE_NAMESPACES)}
    >
      <Nav />
      {children}
      <Footer />
    </NextIntlClientProvider>
  );
}
