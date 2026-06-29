import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  ReceiptText,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { getLocale } from "next-intl/server";

import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { MagicCard } from "@/components/magicui/magic-card";
import LanguageSwitcher from "@/components/footer/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ScrollSectionButton from "@/components/ui/scroll-section-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildSignupCheckoutHref } from "@/lib/checkout-intent";
import { localizedPath } from "@/lib/i18n-routing";
import {
  formatPlanAmount,
  getPlanCurrencyPrice,
  getVisiblePlans,
  type PlanId,
} from "@/lib/plans";
import {
  getCountryFromHeaders,
  getPricingCurrency,
  type PricingCurrency,
} from "@/lib/pricing-currency";
import {
  buildMarketingMetadata,
  localizedAbsoluteUrl,
  serializeJsonLd,
} from "@/lib/seo";

const sectionLabel =
  "text-xs font-semibold uppercase tracking-[0.18em] text-brand";
const sectionTitle =
  "mt-3 max-w-3xl text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl";
const sectionIntro = "mt-4 max-w-2xl text-base leading-7 text-ink-muted";
const LANDING_SECTION_OFFSET = -96;
const DEMO_VIDEO_SRC =
  "https://res.cloudinary.com/dwxnpxmyw/video/upload/f_auto,q_auto:good,vc_auto,c_limit,w_1600/v1782680543/saas/kronoma_demo_web_j0qkxa.mp4";

const copy = {
  fr: {
    metadata: {
      title:
        "Kronoma | Gestion simple pour indépendants, freelances et petites structures",
      description:
        "Centralisez vos clients, projets, prestations, frais, revenus, factures et temps passé dans un outil simple pensé pour gérer votre activité avec plus de clarté.",
    },
    nav: {
      home: "Accueil",
      features: "Fonctions",
      pricing: "Tarifs",
      blog: "Blog",
      about: "A propos",
      faq: "F.A.Q",
      signIn: "Connexion",
      cta: "Essayer gratuitement",
      menu: "Ouvrir la navigation",
    },
    hero: {
      title: "Gardez une vue claire sur votre activité.",
      subtitle: "Sans notes éparpillées, fichiers séparés ni outils compliqués.",
      subtitleLines: [
        "Sans notes éparpillées, fichiers séparés",
        "ni outils compliqués.",
      ],
      paragraph:
        "Kronoma rassemble vos clients, projets, frais, factures, revenus et temps utile dans un espace simple.",
      ctaPrimary: "Essayer gratuitement",
      ctaSecondary: "Voir comment ça marche",
      videoLabel: "Vidéo de démonstration",
      videoTitle: "Aperçu de Kronoma",
      videoMeta: "2 min",
    },
    problem: {
      eyebrow: "Le vrai problème",
      title: "Quand tout est dispersé, vous perdez vite en clarté.",
      text: "Un client dans vos messages, une prestation dans un fichier, un reçu dans votre boîte mail, une facture dans un dossier, une relance dans votre tête... À force, il devient difficile de savoir où en est vraiment votre activité.",
      beforeTitle: "Aujourd'hui",
      afterTitle: "Avec Kronoma",
      before: [
        "Des infos client dans plusieurs endroits",
        "Des frais ou reçus difficiles à retrouver",
        "Des factures suivies à la main",
        "Des revenus approximatifs",
        "Du temps ou des prestations parfois oubliés",
      ],
      after: [
        "Clients, projets et prestations centralisés",
        "Frais et justificatifs au bon endroit",
        "Factures suivies clairement",
        "Revenus et dépenses visibles",
        "Temps passé disponible quand c'est utile",
      ],
    },
    benefits: {
      eyebrow: "Bénéfices",
      title: "Une gestion plus claire, sans outil compliqué.",
      subtitle:
        "Kronoma vous aide à suivre l'essentiel de votre activité au quotidien, sans transformer votre administratif en usine à gaz.",
      cards: [
        {
          title: "Centralisez vos clients et projets",
          text: "Gardez toutes les informations importantes au même endroit : clients, projets, prestations, statuts et historique.",
          icon: Users,
        },
        {
          title: "Suivez vos frais professionnels",
          text: "Ajoutez vos dépenses, conservez vos justificatifs et gardez une trace claire de ce que vous dépensez pour votre activité.",
          icon: ReceiptText,
        },
        {
          title: "Gérez vos factures plus sereinement",
          text: "Créez vos factures, suivez leur statut et voyez rapidement ce qui est payé, envoyé ou encore à facturer.",
          icon: FileText,
        },
        {
          title: "Gardez une vue sur vos revenus",
          text: "Comprenez ce que vous gagnez, ce que vous dépensez et ce qui reste à encaisser.",
          icon: BarChart3,
        },
        {
          title: "Suivez le temps quand c'est utile",
          text: "Travaillez à l'heure, au forfait ou par projet. Le suivi du temps est là quand vous en avez besoin, sans imposer votre façon de travailler.",
          icon: Clock3,
        },
        {
          title: "Exportez vos données",
          text: "Gardez la main sur vos informations et exportez ce dont vous avez besoin pour vos suivis ou votre administratif.",
          icon: Download,
        },
      ],
    },
    steps: {
      eyebrow: "Comment ça marche",
      title: "De l'activité quotidienne à une vision claire.",
      subtitle:
        "Ajoutez ce que vous faites au fil de l'eau, puis retrouvez une vue structurée sur vos clients, projets, frais, factures et revenus.",
      items: [
        {
          title: "Ajoutez vos clients et projets",
          text: "Créez votre base client, organisez vos projets et gardez vos informations importantes au même endroit.",
        },
        {
          title: "Suivez vos prestations, frais et temps",
          text: "Ajoutez ce que vous réalisez, ce que vous dépensez et le temps passé lorsque c'est nécessaire.",
        },
        {
          title: "Facturez et suivez vos revenus",
          text: "Créez vos factures, suivez les paiements et gardez une vue claire sur ce qui est payé ou encore à encaisser.",
        },
      ],
    },
    midCta: {
      title: "Prêt à structurer votre activité ?",
      text: "Commencez par centraliser vos clients, projets, frais et factures dans un espace clair.",
      ctaPrimary: "Commencer gratuitement",
      ctaSecondary: "Voir les tarifs",
    },
    features: {
      eyebrow: "Fonctionnalités",
      title: "Tout l'essentiel pour suivre votre activité.",
      subtitle:
        "Des fonctions simples, pensées pour garder le fil sans basculer dans un outil trop lourd.",
      items: [
        {
          title: "Clients",
          text: "Regroupez les informations de vos clients et retrouvez facilement leurs projets, prestations, factures et dépenses associées.",
          icon: Users,
        },
        {
          title: "Projets",
          text: "Organisez votre travail par client ou par mission, avec une vue claire sur ce qui est en cours, terminé ou à facturer.",
          icon: FolderKanban,
        },
        {
          title: "Prestations",
          text: "Gardez une trace de ce que vous réalisez, que vous facturiez à l'heure, au forfait ou par projet.",
          icon: ListChecks,
        },
        {
          title: "Frais professionnels",
          text: "Ajoutez vos dépenses, associez-les à un client ou à un projet, et conservez une trace de vos justificatifs.",
          icon: ReceiptText,
        },
        {
          title: "Factures",
          text: "Créez vos factures, suivez leur statut et évitez les oublis de paiement ou de relance.",
          icon: FileText,
        },
        {
          title: "Revenus et dépenses",
          text: "Visualisez plus facilement ce que votre activité génère et ce qu'elle vous coûte.",
          icon: CircleDollarSign,
        },
        {
          title: "Suivi du temps",
          text: "Lancez un timer ou ajoutez du temps manuellement lorsque vous devez suivre des heures pour un client ou un projet.",
          icon: Clock3,
        },
        {
          title: "Exports",
          text: "Exportez vos données lorsque vous devez les transmettre, les archiver ou les analyser.",
          icon: Download,
        },
      ],
    },
    import: {
      eyebrow: "Import clients",
      title: "Importez vos clients et démarrez sans repartir de zéro.",
      text: "Vous avez déjà une liste de clients dans un fichier Excel ou CSV ? Importez-la dans Kronoma et retrouvez rapidement votre base client dans un espace plus clair.",
      bullets: [
        "Importez vos clients existants en quelques minutes",
        "Évitez la saisie manuelle",
        "Gardez une base propre pour vos projets, prestations et factures",
      ],
      cta: "Commencer gratuitement",
      file: "clients-actuels.csv",
      preview: ["Client", "Projet", "Statut"],
    },
    audience: {
      eyebrow: "Pour qui ?",
      title:
        "Pensé pour celles et ceux qui gèrent leur activité au quotidien.",
      items: [
        {
          title: "Freelances et consultants",
          text: "Suivez vos clients, missions, prestations, frais et factures sans multiplier les fichiers.",
          icon: BriefcaseBusiness,
        },
        {
          title: "Créatifs et prestataires",
          text: "Gardez une trace claire de vos projets, forfaits, dépenses et livrables.",
          icon: Sparkles,
        },
        {
          title: "Coachs, formateurs et indépendants",
          text: "Centralisez vos clients, séances, revenus et factures dans un outil simple.",
          icon: Users,
        },
        {
          title: "Petites structures",
          text: "Gardez une vision claire de votre activité sans passer sur un logiciel trop lourd.",
          icon: LayoutDashboard,
        },
      ],
    },
    pricing: {
      eyebrow: "Tarifs",
      title: "Des offres simples pour gérer votre activité.",
      subtitle:
        "Commencez gratuitement, puis choisissez l'offre adaptée à votre façon de travailler.",
      notes: {
        FREE: "Pour découvrir Kronoma et centraliser les bases de votre activité.",
        PRO: "Pour gérer vos clients, projets, prestations, frais, factures et suivis avec plus de confort.",
        LIFETIME:
          "Un accès complet en paiement unique, pour celles et ceux qui préfèrent éviter l'abonnement.",
      },
      perks: {
        FREE: [
          "✓ 1 utilisateur",
          "✓ Suivi du temps basique",
          "✓ Clients limites",
          "✓ Factures limitees / mois",
          "✗ QR facture",
          "✗ Exports",
          "✗ Analytics avancees",
          "✗ Suivi des depenses",
        ],
        PRO: [
          "✓ Time tracking complet",
          "✓ Clients illimites",
          "✓ Projets",
          "✓ Generation de factures",
          "✓ QR-facture suisse pour profils CH",
          "✓ Rappels de paiement",
          "✓ Historique complet des sessions",
          "✓ Analytics avancees",
          "✓ Suivi des depenses",
          "✓ Exports CSV",
          "✓ Templates de facture personnalises",
          "✓ Reporting avance",
        ],
        LIFETIME: [
          "✓ Time tracking complet",
          "✓ Clients illimites",
          "✓ Projets",
          "✓ Generation de factures",
          "✓ QR-facture suisse pour profils CH",
          "✓ Rappels de paiement",
          "✓ Historique complet des sessions",
          "✓ Analytics avancees",
          "✓ Suivi des depenses",
          "✓ Exports CSV",
          "✓ Templates de facture personnalises",
          "✓ Reporting avance",
          "✓ Acces Pro à vie",
        ],
      },
      cta: "Choisir cette offre",
      freeCta: "Commencer gratuitement",
      suffixMonthly: "/ mois",
      suffixLifetime: "paiement unique",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Questions fréquentes.",
      items: [
        {
          q: "Kronoma est-il seulement un outil de suivi du temps ?",
          a: "Non. Le suivi du temps fait partie de Kronoma, mais l'objectif principal est de vous aider à centraliser votre activité : clients, projets, prestations, frais, revenus et factures.",
        },
        {
          q: "Puis-je utiliser Kronoma si je ne facture pas à l'heure ?",
          a: "Oui. Kronoma convient aussi aux indépendants qui travaillent au forfait, à la prestation ou par projet. Le temps peut être suivi quand c'est utile, mais il n'est pas obligatoire.",
        },
        {
          q: "Puis-je gérer mes clients et projets ?",
          a: "Oui. Vous pouvez organiser votre activité par client et par projet, puis y associer prestations, frais, temps passé et factures.",
        },
        {
          q: "Puis-je suivre mes frais professionnels ?",
          a: "Oui. Kronoma vous permet de garder une trace de vos dépenses et de vos justificatifs afin de mieux suivre ce que coûte votre activité.",
        },
        {
          q: "Puis-je créer et suivre mes factures ?",
          a: "Oui. Vous pouvez créer vos factures, suivre leur statut et garder une vue claire sur ce qui est payé, envoyé ou encore à facturer.",
        },
        {
          q: "Kronoma est-il adapté aux petites structures ?",
          a: "Oui. Kronoma est pensé pour les indépendants, freelances et petites structures qui veulent une solution claire sans outil trop lourd.",
        },
        {
          q: "Puis-je exporter mes données ?",
          a: "Oui. Vous pouvez exporter vos données pour les conserver, les partager ou les utiliser dans votre suivi administratif.",
        },
        {
          q: "Kronoma remplace-t-il un logiciel de comptabilité complet ?",
          a: "Non. Kronoma vous aide surtout à mieux suivre votre activité quotidienne, vos clients, vos prestations, vos frais et vos factures.",
        },
      ],
    },
    closing: {
      title: "Reprenez une vue claire sur votre activité.",
      text: "Centralisez vos clients, projets, prestations, frais et factures dans un outil simple, pensé pour les indépendants, freelances et petites structures.",
      ctaPrimary: "Essayer gratuitement",
      ctaSecondary: "Voir les tarifs",
      microcopy: "Démarrez en quelques minutes. Sans complexité inutile.",
    },
    footer:
      "Kronoma aide les indépendants, freelances et petites structures à centraliser leur activité : clients, projets, prestations, frais, revenus et factures.",
  },
  en: {
    metadata: {
      title: "Kronoma | Simple business management for freelancers and small teams",
      description:
        "Manage clients, projects, services, expenses, invoices, revenue and time in one clear workspace built for freelancers and small teams.",
    },
    nav: {
      home: "Home",
      features: "Features",
      pricing: "Pricing",
      blog: "Blog",
      about: "About",
      faq: "F.A.Q",
      signIn: "Sign in",
      cta: "Start free",
      menu: "Open navigation",
    },
    hero: {
      title: "Keep a clear view of your\u00a0business.",
      subtitle: "No scattered notes, separate files or complicated tools.",
      subtitleLines: [
        "No scattered notes, separate files",
        "or complicated tools.",
      ],
      paragraph:
        "Kronoma brings clients, projects, expenses, invoices, revenue and useful tracked time into one simple workspace.",
      ctaPrimary: "Start free",
      ctaSecondary: "See how it works",
      videoLabel: "Demo video",
      videoTitle: "Kronoma overview",
      videoMeta: "2 min",
    },
    problem: {
      eyebrow: "The real problem",
      title: "When everything is scattered, clarity disappears.",
      text: "A client in your messages, a receipt in your inbox, a service in a spreadsheet, an invoice in a folder, a reminder in your head... Kronoma brings everything together so you can manage your business with more confidence.",
      beforeTitle: "Today",
      afterTitle: "With Kronoma",
      before: [
        "Client details spread across tools",
        "Expenses and receipts hard to find",
        "Invoices followed by hand",
        "Approximate revenue",
        "Time or services sometimes forgotten",
      ],
      after: [
        "Clients, projects and services centralized",
        "Expenses and receipts in the right place",
        "Invoices tracked clearly",
        "Revenue and expenses visible",
        "Tracked time available when useful",
      ],
    },
    benefits: {
      eyebrow: "Benefits",
      title: "Clearer management, without a complicated tool.",
      subtitle:
        "Kronoma helps you track the essentials of your business day to day, without turning admin into a heavy system.",
      cards: [
        {
          title: "Centralize clients and projects",
          text: "Keep important information in one place: clients, projects, services, statuses and history.",
          icon: Users,
        },
        {
          title: "Track business expenses",
          text: "Add expenses, keep receipts and maintain a clear record of what your business costs.",
          icon: ReceiptText,
        },
        {
          title: "Manage invoices more calmly",
          text: "Create invoices, track their status and quickly see what is paid, sent or still to invoice.",
          icon: FileText,
        },
        {
          title: "Keep an eye on revenue",
          text: "Understand what you earn, what you spend and what is still waiting to be paid.",
          icon: BarChart3,
        },
        {
          title: "Track time when useful",
          text: "Work hourly, fixed-fee or by project. Time tracking is there when you need it, without forcing your workflow.",
          icon: Clock3,
        },
        {
          title: "Export your data",
          text: "Stay in control of your information and export what you need for your admin follow-up.",
          icon: Download,
        },
      ],
    },
    steps: {
      eyebrow: "How it works",
      title: "From daily work to a clear view.",
      subtitle:
        "Add what you do as you go, then get a structured view of your clients, projects, expenses, invoices and revenue.",
      items: [
        {
          title: "Add clients and projects",
          text: "Create your client base, organize projects and keep important information in one place.",
        },
        {
          title: "Track services, expenses and time",
          text: "Add what you deliver, what you spend and the time spent whenever needed.",
        },
        {
          title: "Invoice and follow revenue",
          text: "Create invoices, track payments and keep a clear view of what is paid or still outstanding.",
        },
      ],
    },
    midCta: {
      title: "Ready to structure your business?",
      text: "Start by centralizing clients, projects, expenses and invoices in one clear workspace.",
      ctaPrimary: "Start free",
      ctaSecondary: "See pricing",
    },
    features: {
      eyebrow: "Features",
      title: "The essentials to track your business.",
      subtitle:
        "Simple features designed to help you keep track without moving into a heavy tool.",
      items: [
        {
          title: "Clients",
          text: "Group client information and easily find their projects, services, invoices and related expenses.",
          icon: Users,
        },
        {
          title: "Projects",
          text: "Organize work by client or mission, with a clear view of what is active, done or ready to invoice.",
          icon: FolderKanban,
        },
        {
          title: "Services",
          text: "Keep track of what you deliver, whether you invoice hourly, fixed-fee or by project.",
          icon: ListChecks,
        },
        {
          title: "Business expenses",
          text: "Add expenses, connect them to a client or project, and keep a record of receipts.",
          icon: ReceiptText,
        },
        {
          title: "Invoices",
          text: "Create invoices, track their status and reduce forgotten payments or reminders.",
          icon: FileText,
        },
        {
          title: "Revenue and expenses",
          text: "See more easily what your business generates and what it costs.",
          icon: CircleDollarSign,
        },
        {
          title: "Time tracking",
          text: "Start a timer or add time manually when you need to track hours for a client or project.",
          icon: Clock3,
        },
        {
          title: "Exports",
          text: "Export data when you need to share, archive or analyze it.",
          icon: Download,
        },
      ],
    },
    import: {
      eyebrow: "Client import",
      title: "Import clients and start without rebuilding everything.",
      text: "Already have a client list in Excel or CSV? Import it into Kronoma and quickly move your client base into a clearer workspace.",
      bullets: [
        "Import existing clients in minutes",
        "Avoid manual entry",
        "Keep a clean base for projects, services and invoices",
      ],
      cta: "Start free",
      file: "current-clients.csv",
      preview: ["Client", "Project", "Status"],
    },
    audience: {
      eyebrow: "Who it is for",
      title: "Built for people who manage client work every day.",
      items: [
        {
          title: "Freelancers and consultants",
          text: "Track clients, missions, services, expenses and invoices without multiplying files.",
          icon: BriefcaseBusiness,
        },
        {
          title: "Creatives and service providers",
          text: "Keep a clear trace of projects, packages, expenses and deliverables.",
          icon: Sparkles,
        },
        {
          title: "Coaches, trainers and independents",
          text: "Centralize clients, sessions, revenue and invoices in one simple tool.",
          icon: Users,
        },
        {
          title: "Small teams",
          text: "Keep a clear view of the business without moving to a tool that feels too heavy.",
          icon: LayoutDashboard,
        },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Simple plans to manage your business.",
      subtitle:
        "Start free, then choose the plan that fits the way you work.",
      notes: {
        FREE: "To discover Kronoma and centralize the basics of your business.",
        PRO: "To manage clients, projects, services, expenses, invoices and follow-up more comfortably.",
        LIFETIME:
          "Complete access with a one-time payment, for people who prefer to avoid subscriptions.",
      },
      perks: {
        FREE: [
          "✓ 1 user",
          "✓ Basic time tracking",
          "✓ Limited clients",
          "✓ Limited invoices / month",
          "✗ QR invoice",
          "✗ Exports",
          "✗ Advanced analytics",
          "✗ Expense tracking",
        ],
        PRO: [
          "✓ Full time tracking",
          "✓ Unlimited clients",
          "✓ Projects",
          "✓ Invoice generation",
          "✓ Swiss QR invoice for CH profiles",
          "✓ Payment reminders",
          "✓ Full session history",
          "✓ Advanced analytics",
          "✓ Expense tracking",
          "✓ CSV exports",
          "✓ Custom invoice templates",
          "✓ Advanced reporting",
        ],
        LIFETIME: [
          "✓ Full time tracking",
          "✓ Unlimited clients",
          "✓ Projects",
          "✓ Invoice generation",
          "✓ Swiss QR invoice for CH profiles",
          "✓ Payment reminders",
          "✓ Full session history",
          "✓ Advanced analytics",
          "✓ Expense tracking",
          "✓ CSV exports",
          "✓ Custom invoice templates",
          "✓ Advanced reporting",
          "✓ Pro access for life",
        ],
      },
      cta: "Choose this plan",
      freeCta: "Start free",
      suffixMonthly: "/ month",
      suffixLifetime: "one-time payment",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Common questions.",
      items: [
        {
          q: "Is Kronoma only a time tracking tool?",
          a: "No. Time tracking is part of Kronoma, but the main goal is to help you centralize your activity: clients, projects, services, expenses, revenue and invoices.",
        },
        {
          q: "Can I use Kronoma if I do not bill hourly?",
          a: "Yes. Kronoma also works for fixed-fee, service-based or project-based work. Time can be tracked when useful, but it is not mandatory.",
        },
        {
          q: "Can I manage clients and projects?",
          a: "Yes. You can organize work by client and project, then connect services, expenses, tracked time and invoices.",
        },
        {
          q: "Can I track business expenses?",
          a: "Yes. Kronoma helps you keep a record of expenses and receipts so you can better follow what your business costs.",
        },
        {
          q: "Can I create and track invoices?",
          a: "Yes. You can create invoices, follow their status and keep a clear view of what is paid, sent or still to invoice.",
        },
        {
          q: "Is Kronoma suitable for small teams?",
          a: "Yes. Kronoma is designed for independents, freelancers and small teams that want clarity without a heavy tool.",
        },
        {
          q: "Can I export my data?",
          a: "Yes. You can export data to keep it, share it or use it in your administrative follow-up.",
        },
        {
          q: "Does Kronoma replace full accounting software?",
          a: "No. Kronoma is mainly here to help you track daily business activity, clients, services, expenses and invoices.",
        },
      ],
    },
    closing: {
      title: "Get a clearer view of your business.",
      text: "Centralize your clients, projects, services, expenses and invoices in one simple workspace built for freelancers and small teams.",
      ctaPrimary: "Start free",
      ctaSecondary: "See pricing",
      microcopy: "Start in a few minutes. No unnecessary complexity.",
    },
    footer:
      "Kronoma helps freelancers, independents and small teams centralize clients, projects, services, expenses, revenue and invoices.",
  },
} as const;

type LandingCopy = (typeof copy)[keyof typeof copy];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const pageCopy = getCopy(locale);

  return buildMarketingMetadata({
    title: pageCopy.metadata.title,
    description: pageCopy.metadata.description,
    path: "/",
    locale,
  });
}

function getCopy(locale: string): LandingCopy {
  return locale === "en" ? copy.en : copy.fr;
}

function planDisplayName(planId: string) {
  if (planId === "LIFETIME") return "Lifetime";
  return planId === "PRO" ? "Pro" : "Free";
}

function formatPrice({
  currency,
  locale,
  planId,
}: {
  currency: PricingCurrency;
  locale: string;
  planId: PlanId;
}) {
  const planPrice = getPlanCurrencyPrice(planId, currency);
  return formatPlanAmount(planPrice.priceAmount, currency, locale);
}

export default async function LandingPage() {
  const locale = await getLocale();
  const c = getCopy(locale);
  const visiblePlans = getVisiblePlans();
  const requestHeaders = await headers();
  const pricingCurrency = getPricingCurrency({
    country: getCountryFromHeaders(requestHeaders),
    locale,
  });
  const canonicalUrl = localizedAbsoluteUrl("/", locale);
  const signInHref = localizedPath("/auth/login", locale);
  const startHref = localizedPath(buildSignupCheckoutHref("PRO", "monthly", pricingCurrency), locale);
  const pricingHref = localizedPath("/pricing", locale);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Kronoma",
      url: canonicalUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: locale,
      description: c.metadata.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-white text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="relative overflow-hidden">
        <section className="relative mx-auto flex w-full maxW flex-col items-center px-6 pb-14 pt-28 text-center sm:pt-32 lg:pb-20 lg:pt-36">
          <div className="mx-auto flex max-w-4xl flex-col items-center">
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.06] text-ink sm:text-6xl lg:text-7xl">
              <AnimatedGradientText>{c.hero.title}</AnimatedGradientText>
            </h1>
            <p className="mt-5 max-w-2xl text-xl font-medium leading-snug text-ink sm:text-2xl">
              {c.hero.subtitleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
              {c.hero.paragraph}
            </p>
            <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-[0_18px_44px_-24px_rgba(249,115,22,0.95)] hover:bg-brand/90"
              >
                <Link href={startHref}>
                  {c.hero.ctaPrimary}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <ScrollSectionButton
                sectionId="how"
                offsetY={LANDING_SECTION_OFFSET}
                className="inline-flex h-12 items-center justify-center rounded-full border border-line-strong bg-white/70 px-6 text-sm font-semibold text-ink hover:bg-white"
              >
                {c.hero.ctaSecondary}
              </ScrollSectionButton>
            </div>
          </div>

          <DemoVideoCard c={c} />
        </section>

        <section className="relative mx-auto w-full maxW px-6 py-16">
          <div className="max-w-3xl">
            <p className={sectionLabel}>{c.problem.eyebrow}</p>
            <h2 className={sectionTitle}>{c.problem.title}</h2>
            <p className={sectionIntro}>{c.problem.text}</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <ComparisonCard
              title={c.problem.beforeTitle}
              items={c.problem.before}
              variant="muted"
            />
            <ComparisonCard
              title={c.problem.afterTitle}
              items={c.problem.after}
              variant="positive"
            />
          </div>
        </section>

        <section id="features" className="mx-auto w-full maxW scroll-mt-24 px-6 py-16">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={sectionLabel}>{c.benefits.eyebrow}</p>
              <h2 className={sectionTitle}>{c.benefits.title}</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-ink-muted">
              {c.benefits.subtitle}
            </p>
          </div>
          <BentoGrid className="mt-10">
            {c.benefits.cards.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <BentoCard
                  key={benefit.title}
                  className={
                    index === 0 || index === 2
                      ? "md:col-span-3"
                      : "md:col-span-2"
                  }
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-ink">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {benefit.text}
                  </p>
                </BentoCard>
              );
            })}
          </BentoGrid>
        </section>

        <section id="how" className="mx-auto w-full maxW scroll-mt-24 px-6 py-16">
          <div className="grid gap-10 rounded-[28px] border border-line bg-white p-6 shadow-[0_28px_80px_-66px_rgba(29,27,22,0.42)] lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
            <div>
              <p className={sectionLabel}>{c.steps.eyebrow}</p>
              <h2 className={sectionTitle}>{c.steps.title}</h2>
              <p className={sectionIntro}>{c.steps.subtitle}</p>
            </div>
            <div className="grid gap-4">
              {c.steps.items.map((step, index) => (
                <MagicCard key={step.title} className="p-5">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-ink-muted">
                        {step.text}
                      </p>
                    </div>
                  </div>
                </MagicCard>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-8">
          <div className="mx-auto max-w-5xl rounded-[28px] bg-ink px-6 py-9 text-center text-white shadow-[0_26px_90px_-64px_rgba(29,27,22,0.86)] sm:px-8">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {c.midCta.title}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/68 sm:text-base">
                {c.midCta.text}
              </p>
            </div>
            <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                className="h-11 rounded-full bg-brand px-5 text-white hover:bg-brand/90"
              >
                <Link href={startHref}>
                  {c.midCta.ctaPrimary}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-white/18 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={pricingHref}>{c.midCta.ctaSecondary}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="max-w-3xl">
            <p className={sectionLabel}>{c.features.eyebrow}</p>
            <h2 className={sectionTitle}>{c.features.title}</h2>
            <p className={sectionIntro}>{c.features.subtitle}</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.features.items.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="border-line bg-white shadow-[0_18px_55px_-48px_rgba(29,27,22,0.38)]"
                >
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg leading-tight text-ink">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-6 text-ink-muted">
                      {feature.text}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="grid gap-8 overflow-hidden rounded-[28px] border border-line bg-ink p-6 text-white shadow-[0_28px_90px_-62px_rgba(29,27,22,0.85)] lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                {c.import.eyebrow}
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                {c.import.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                {c.import.text}
              </p>
              <ul className="mt-6 grid gap-3">
                {c.import.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-sm text-white/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-7 h-11 w-fit rounded-full bg-brand px-5 text-white hover:bg-brand/90"
              >
                <Link href={startHref}>{c.import.cta}</Link>
              </Button>
            </div>
            <MagicCard className="bg-white/95 p-4 text-ink">
              <div className="rounded-2xl border border-line bg-neutral-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {c.import.file}
                      </p>
                      <p className="text-xs text-ink-muted">CSV / Excel</p>
                    </div>
                  </div>
                  <Badge className="border-line bg-white text-ink-muted hover:bg-white">
                    Import
                  </Badge>
                </div>
                <div className="mt-5 overflow-hidden rounded-xl border border-line bg-white">
                  <div className="grid grid-cols-3 bg-ink-soft px-4 py-3 text-xs font-semibold uppercase text-ink-muted">
                    {c.import.preview.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  {[
                    ["Studio Nera", "Shooting produit", "Actif"],
                    ["Atelier Bloom", "Identité visuelle", "À facturer"],
                    ["Cabinet Lenoir", "Formation", "Payé"],
                  ].map((row) => (
                    <div
                      key={row.join("-")}
                      className="grid grid-cols-3 border-t border-line px-4 py-3 text-sm"
                    >
                      {row.map((cell) => (
                        <span key={cell} className="truncate text-ink-muted">
                          {cell}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </MagicCard>
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="max-w-3xl">
            <p className={sectionLabel}>{c.audience.eyebrow}</p>
            <h2 className={sectionTitle}>{c.audience.title}</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {c.audience.items.map((item) => {
              const Icon = item.icon;
              return (
                <MagicCard key={item.title} className="p-5">
                  <Icon className="h-5 w-5 text-brand" />
                  <h3 className="mt-5 text-base font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {item.text}
                  </p>
                </MagicCard>
              );
            })}
          </div>
        </section>

        <section id="pricing" className="mx-auto w-full maxW scroll-mt-24 px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className={sectionLabel}>{c.pricing.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
              {c.pricing.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-muted">
              {c.pricing.subtitle}
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {visiblePlans.map((plan) => {
              const note =
                c.pricing.notes[plan.id as keyof typeof c.pricing.notes] ??
                c.pricing.notes.PRO;
              const perks =
                c.pricing.perks[plan.id as keyof typeof c.pricing.perks] ??
                c.pricing.perks.PRO;
              const isLifetime = plan.billingType === "lifetime";
              const planPrice = getPlanCurrencyPrice(plan.id, pricingCurrency);
              const isFree = planPrice.priceAmount === 0;

              return (
                <Card
                  key={plan.id}
                  className={`flex min-h-[430px] flex-col border-line bg-white ${
                    plan.highlight
                      ? "shadow-[0_26px_80px_-50px_rgba(249,115,22,0.65)] ring-1 ring-brand/30"
                      : "shadow-[0_20px_60px_-52px_rgba(29,27,22,0.55)]"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="text-xl text-ink">
                        {planDisplayName(plan.id)}
                      </CardTitle>
                      {plan.highlight ? (
                        <Badge className="border-brand/20 bg-brand/10 text-brand hover:bg-brand/10">
                          Premium
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-4">
                      <span className="text-4xl font-semibold text-ink">
                        {formatPrice({
                          currency: pricingCurrency,
                          locale,
                          planId: plan.id,
                        })}
                      </span>
                      {!isFree ? (
                        <span className="ml-2 text-sm text-ink-muted">
                          {isLifetime
                            ? c.pricing.suffixLifetime
                            : c.pricing.suffixMonthly}
                        </span>
                      ) : null}
                    </div>
                    <CardDescription className="min-h-[72px] text-sm leading-6 text-ink-muted">
                      {note}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-8">
                    <div className="space-y-3">
                      {perks.map((perk) => {
                        const included = perk.startsWith("✓");
                        const label = perk.replace(/^[✓✗]\s*/, "");

                        return (
                          <div
                            key={perk}
                            className={`flex items-center gap-2 text-sm ${
                              included ? "text-ink-muted" : "text-ink-muted/45"
                            }`}
                          >
                            {included ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                            ) : (
                              <X className="h-4 w-4 shrink-0 text-ink-muted/35" />
                            )}
                            <span className={!included ? "line-through" : ""}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      asChild
                      className="mt-auto h-11 rounded-full bg-brand text-white hover:bg-brand/90"
                    >
                      <Link
                        href={
                          isFree
                            ? startHref
                            : localizedPath(
                                buildSignupCheckoutHref(plan.id, "monthly", pricingCurrency),
                                locale,
                              )
                        }
                      >
                        {isFree ? c.pricing.freeCta : c.pricing.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="faq" className="mx-auto w-full maxW scroll-mt-24 px-6 py-16">
          <div className="max-w-3xl">
            <p className={sectionLabel}>{c.faq.eyebrow}</p>
            <h2 className={sectionTitle}>{c.faq.title}</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {c.faq.items.map((item) => (
              <Card key={item.q} className="h-full border-line bg-white">
                <CardHeader className="p-5">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="mt-1 h-4 w-4 shrink-0 text-brand" />
                    <div>
                      <CardTitle className="text-base leading-6 text-ink">
                        {item.q}
                      </CardTitle>
                      <CardDescription className="mt-2 text-sm leading-6 text-ink-muted">
                        {item.a}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full maxW px-6 py-16">
          <div className="overflow-hidden rounded-[32px] border border-line bg-ink px-6 py-12 text-center text-white shadow-[0_30px_100px_-65px_rgba(29,27,22,0.9)] sm:px-10 lg:py-16">
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
              {c.closing.title}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70">
              {c.closing.text}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-full bg-brand px-6 text-white hover:bg-brand/90">
                <Link href={startHref}>{c.closing.ctaPrimary}</Link>
              </Button>
              <ScrollSectionButton
                sectionId="pricing"
                offsetY={LANDING_SECTION_OFFSET}
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
              >
                {c.closing.ctaSecondary}
              </ScrollSectionButton>
            </div>
            <p className="mt-5 text-sm text-white/55">{c.closing.microcopy}</p>
          </div>
        </section>

        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex w-full maxW flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Kronoma</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
                {c.footer}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex gap-4 text-sm text-ink-muted">
                <Link href={pricingHref} className="hover:text-ink">
                  {c.nav.pricing}
                </Link>
                <Link href={signInHref} className="hover:text-ink">
                  {c.nav.signIn}
                </Link>
              </div>
              <div className="w-full sm:w-36">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function DemoVideoCard({ c }: { c: LandingCopy }) {
  return (
    <div className="relative z-10 mt-12 aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-[22px] bg-ink shadow-[0_28px_90px_-58px_rgba(29,27,22,0.72)] [clip-path:inset(0_round_22px)] sm:mt-14">
      <video
        aria-label={c.hero.videoTitle}
        autoPlay
        className="pointer-events-none absolute inset-0 z-10 h-full w-full scale-[1.012] object-cover"
        disablePictureInPicture
        loop
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
      >
        <source src={DEMO_VIDEO_SRC} />
      </video>
    </div>
  );
}

function ComparisonCard({
  title,
  items,
  variant,
}: {
  title: string;
  items: readonly string[];
  variant: "muted" | "positive";
}) {
  const isPositive = variant === "positive";

  return (
    <MagicCard
      className={`p-5 ${
        isPositive ? "bg-white ring-1 ring-brand/20" : "bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isPositive ? "bg-brand/10 text-brand" : "bg-ink-soft text-ink-muted"
          }`}
        >
          {isPositive ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
      </div>
      <ul className="mt-5 grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-6 text-ink-muted">
            <span
              className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                isPositive ? "bg-brand" : "bg-ink-muted/35"
              }`}
            />
            {item}
          </li>
        ))}
      </ul>
    </MagicCard>
  );
}
