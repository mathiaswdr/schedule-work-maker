import "dotenv/config";

import {
  BlogPostStatus,
  DetectedInvoiceStatus,
  EmailProvider,
  ExpenseRecurrence,
  InvoiceSource,
  InvoiceStatus,
  InvoiceTemplateType,
  PrismaClient,
  UserPlan,
  WorkSessionStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "kronoma.contact@gmail.com";
const DEMO_EMAIL =
  process.argv[2] || process.env.DEMO_USER_EMAIL || DEFAULT_EMAIL;

const BUSINESS = {
  companyName: "Atelier Lumina Studio",
  address: "Rue du Simplon 18",
  postalCode: "1006",
  city: "Lausanne",
  country: "CH",
  siret: "IDE CHE-248.519.774",
  email: "hello@atelier-lumina.ch",
  phone: "+41 21 555 18 42",
  vatMention: "Non assujetti a la TVA selon l'art. 10 LTVA.",
};

const BANK_ACCOUNT = {
  label: "Compte principal CHF",
  bankName: "Banque Cantonale Vaudoise",
  iban: "CH9300762011623852957",
  bic: "BCVLCH2LXXX",
};

const blogPosts = [
  {
    translationKey: "freelance-time-tracking",
    locale: "fr",
    slug: "comment-suivre-son-temps-de-travail-en-freelance",
    title: "Comment suivre son temps de travail en freelance sans se compliquer la vie",
    excerpt:
      "Une methode simple pour noter ses heures, garder le detail par client et transformer le temps travaille en factures plus fiables.",
    metaTitle:
      "Comment suivre son temps de travail en freelance | Guide Kronoma",
    metaDescription:
      "Decouvrez une methode simple pour suivre votre temps de travail en freelance, eviter les oublis et preparer vos factures plus rapidement.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
    tags: ["Suivi du temps", "Freelance"],
    readingMinutes: 5,
    publishedDayOffset: 21,
    content: {
      intro:
        "Le suivi du temps n'a pas besoin d'etre lourd. Pour un freelance, le bon systeme est celui qui capture les heures au moment ou elles sont faites, puis les relie clairement a un client, un projet et une facture.",
      sections: [
        {
          heading: "Pourquoi suivre ses heures meme quand on facture au forfait",
          body: [
            "Beaucoup de freelances suivent leurs heures uniquement lorsqu'ils vendent au taux horaire. Pourtant, le suivi du temps reste utile au forfait, car il montre si une mission reste rentable ou si le cadrage doit etre ajuste.",
            "Il permet aussi de garder une trace objective lorsque le client demande plus de details, de comparer les projets entre eux et de mieux estimer les prochains devis.",
          ],
          bullets: [
            "Identifier les missions qui depassent le temps prevu.",
            "Comparer le temps estime et le temps reel.",
            "Garder une base fiable pour les prochains devis.",
          ],
        },
        {
          heading: "La methode simple en quatre donnees",
          body: [
            "Pour que le suivi reste durable, chaque session doit contenir peu d'informations, mais les bonnes. Notez la date, le client, le projet et une courte description de la tache.",
            "Ces quatre donnees suffisent a comprendre ou part le temps, a retrouver le contexte et a preparer une facture lisible sans reconstruire la semaine de memoire.",
          ],
          bullets: [
            "Date et horaire de la session.",
            "Client ou projet associe.",
            "Duree nette, pauses exclues.",
            "Note courte sur le travail realise.",
          ],
        },
        {
          heading: "Quand utiliser un outil plutot qu'un tableur",
          body: [
            "Un tableur fonctionne au debut, mais il devient fragile lorsque les clients, les projets et les factures se multiplient. Les oublis, doublons et corrections manuelles prennent vite plus de temps que le suivi lui-meme.",
            "Un outil dedie devient utile des que vous voulez relier vos heures a vos clients, suivre les pauses, consulter des statistiques et generer des factures a partir de donnees deja propres.",
          ],
        },
      ],
      faq: [
        {
          question: "Faut-il suivre chaque minute de travail ?",
          answer:
            "Non. L'objectif est d'avoir une base fiable, pas de micro-controler sa journee. Des sessions claires par tache ou par bloc de travail suffisent dans la plupart des cas.",
        },
        {
          question: "Le suivi du temps est-il utile pour les forfaits ?",
          answer:
            "Oui, car il aide a mesurer la rentabilite reelle d'un forfait et a mieux estimer les prochaines missions.",
        },
        {
          question: "Quelle est la frequence ideale pour saisir ses heures ?",
          answer:
            "Le plus fiable est de lancer le suivi pendant le travail. A defaut, une saisie quotidienne reste beaucoup plus precise qu'une reconstruction en fin de mois.",
        },
      ],
      cta: {
        title: "Suivez vos heures sans reconstruire votre semaine.",
        body:
          "Kronoma relie vos sessions de travail a vos clients, projets et factures pour garder une trace claire de votre activite.",
        href: "/pricing",
        label: "Voir les offres",
      },
    },
  },
  {
    translationKey: "swiss-freelance-invoicing-hours",
    locale: "fr",
    slug: "facturation-freelance-suisse-heures-travaillees",
    title: "Facturation freelance en Suisse : comment transformer ses heures travaillees en facture",
    excerpt:
      "Les points a verifier pour passer d'un suivi d'heures propre a une facture claire, notamment pour les independants bases en Suisse.",
    metaTitle:
      "Facturation freelance Suisse : heures travaillees et facture | Kronoma",
    metaDescription:
      "Guide pratique pour transformer vos heures travaillees en facture freelance claire, avec les points utiles pour les independants en Suisse.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
    tags: ["Facturation", "Suisse"],
    readingMinutes: 6,
    publishedDayOffset: 14,
    content: {
      intro:
        "Une facture fiable commence avant la facture elle-meme. Elle depend d'un suivi d'heures propre, d'une description claire du travail et de donnees client a jour.",
      sections: [
        {
          heading: "Relier chaque heure au bon client",
          body: [
            "La premiere source d'erreur vient souvent des heures non attribuees. Si une session n'est pas liee au bon client ou au bon projet, la facture doit etre reconstruite manuellement.",
            "Un suivi propre garde l'association entre la duree, le projet et la note de travail. La facture devient alors une synthese, pas un travail de recherche.",
          ],
        },
        {
          heading: "Presenter les lignes de facture clairement",
          body: [
            "Une facture n'a pas besoin de reprendre chaque minute, mais elle doit etre comprehensible. Regroupez les heures par prestation, projet ou periode selon ce qui aide le client a verifier.",
            "La description doit etre assez precise pour rappeler le contexte, sans transformer la facture en rapport detaille.",
          ],
          bullets: [
            "Nom du client et coordonnees a jour.",
            "Periode ou projet facture.",
            "Description courte de la prestation.",
            "Quantite, prix unitaire, total et devise.",
          ],
        },
        {
          heading: "Cas suisse : devise, coordonnees et QR-facture",
          body: [
            "Pour un profil base en Suisse, les donnees de l'entreprise, l'IBAN, la devise et les mentions utiles doivent rester coherents entre le profil et la facture.",
            "Lorsque le paiement se fait en CHF, une QR-facture peut simplifier le reglement pour le client. L'important est de garder les informations de paiement propres et reutilisables.",
          ],
        },
      ],
      faq: [
        {
          question: "Puis-je facturer plusieurs projets sur une meme facture ?",
          answer:
            "Oui, si les lignes restent lisibles. Il est souvent utile de separer les projets ou les types de prestation pour faciliter la validation cote client.",
        },
        {
          question: "Dois-je joindre le detail complet des heures ?",
          answer:
            "Pas toujours. Une synthese suffit souvent, mais garder le detail dans votre outil permet de repondre rapidement si le client demande une verification.",
        },
        {
          question: "La QR-facture est-elle obligatoire ?",
          answer:
            "Elle depend du contexte de paiement. Pour les independants suisses facturant en CHF, elle peut rendre le paiement plus simple et plus standardise.",
        },
      ],
      cta: {
        title: "Transformez vos heures en factures plus rapidement.",
        body:
          "Avec Kronoma, vos sessions, clients et projets restent connectes jusqu'a la generation de la facture.",
        href: "/pricing",
        label: "Comparer les plans",
      },
    },
  },
  {
    translationKey: "freelance-hourly-rate",
    locale: "fr",
    slug: "calculer-son-taux-horaire-freelance",
    title: "Calculer son taux horaire freelance : la methode simple pour ne pas vendre son temps trop bas",
    excerpt:
      "Un guide pour relier objectifs de revenu, charges, temps facturable et suivi reel des heures afin de fixer un taux horaire defendable.",
    metaTitle:
      "Calculer son taux horaire freelance : methode simple | Kronoma",
    metaDescription:
      "Apprenez a calculer un taux horaire freelance en tenant compte du revenu cible, des charges et du temps réellement facturable.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1400&q=80",
    tags: ["Taux horaire", "Rentabilite"],
    readingMinutes: 5,
    publishedDayOffset: 7,
    content: {
      intro:
        "Un taux horaire freelance ne se calcule pas seulement avec le salaire souhaite. Il doit aussi couvrir les charges, les jours non factures, l'administration et les periodes creuses.",
      sections: [
        {
          heading: "Partir du revenu annuel vise",
          body: [
            "Commencez par definir le revenu net ou brut que vous voulez atteindre sur une annee. Ajoutez ensuite les charges professionnelles, les assurances, les abonnements et les frais recurrents.",
            "Cette base donne le chiffre d'affaires a couvrir avant meme de penser au nombre d'heures vendables.",
          ],
        },
        {
          heading: "Distinguer heures travaillees et heures facturables",
          body: [
            "Toutes les heures travaillees ne sont pas facturables. La prospection, l'administration, les devis, la comptabilite et la formation prennent du temps sans etre directement vendues.",
            "C'est pour cela que le suivi du temps est utile : il montre la part reelle du temps consacree aux missions clientes.",
          ],
          bullets: [
            "Heures de production client.",
            "Temps administratif.",
            "Prospection et avant-vente.",
            "Formation, veille et maintenance interne.",
          ],
        },
        {
          heading: "Ajuster le taux avec les donnees reelles",
          body: [
            "Le premier calcul donne une hypothese. Apres quelques semaines, comparez le temps prevu, le temps reel et le montant facture.",
            "Si les missions debordent souvent, le probleme peut venir du taux, du cadrage ou du type de prestation. Les donnees de temps rendent cette discussion beaucoup plus concrete.",
          ],
        },
      ],
      faq: [
        {
          question: "Quel taux horaire choisir quand on debute ?",
          answer:
            "Il faut eviter de partir uniquement du marche. Calculez d'abord votre seuil de rentabilite, puis comparez-le aux prix pratiques dans votre specialite.",
        },
        {
          question: "Le taux horaire doit-il apparaitre sur toutes les factures ?",
          answer:
            "Pas necessairement. Pour un forfait, vous pouvez facturer une prestation globale tout en suivant vos heures en interne.",
        },
        {
          question: "Quand revoir son taux horaire ?",
          answer:
            "Revoyez-le lorsque vos donnees montrent que vos missions sont moins rentables que prevu, ou lorsque votre expertise et votre demande augmentent.",
        },
      ],
      cta: {
        title: "Mesurez votre rentabilite avec des heures fiables.",
        body:
          "Kronoma vous aide a comprendre le temps reel passe par client et par projet avant de fixer ou reviser vos tarifs.",
        href: "/auth/login",
        label: "Demarrer gratuitement",
      },
    },
  },
  {
    translationKey: "time-tracking-tool-vs-spreadsheet",
    locale: "fr",
    slug: "outil-suivi-temps-independant-vs-tableur",
    title: "Outil de suivi du temps ou tableur : que choisir quand on est independant ?",
    excerpt:
      "Un comparatif pragmatique pour savoir quand un tableur suffit et quand un outil dedie devient plus rentable.",
    metaTitle:
      "Outil de suivi du temps ou tableur pour independant | Kronoma",
    metaDescription:
      "Comparez tableur et outil de suivi du temps pour independants : simplicite, fiabilite, facturation et limites a anticiper.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    tags: ["Comparatif", "Productivite"],
    readingMinutes: 4,
    publishedDayOffset: 3,
    content: {
      intro:
        "Le meilleur outil est celui qui reste utilise. Un tableur peut suffire au debut, mais un outil dedie devient plus interessant quand le suivi doit alimenter les statistiques et la facturation.",
      sections: [
        {
          heading: "Quand le tableur suffit",
          body: [
            "Un tableur est adapte si vous avez peu de clients, peu de projets et une facturation simple. Il permet de commencer sans configuration et de garder une trace minimale.",
            "Sa limite apparait lorsque vous devez retrouver rapidement le detail d'une mission, calculer des totaux fiables ou transformer les heures en facture.",
          ],
        },
        {
          heading: "Quand l'outil dedie devient plus rentable",
          body: [
            "Un outil de suivi du temps devient utile lorsque la saisie manuelle cree des erreurs ou lorsque vous passez trop de temps a consolider les donnees.",
            "Le gain n'est pas seulement le chrono. Il vient du lien entre session, client, projet, statistique et facture.",
          ],
          bullets: [
            "Moins d'oublis de saisie.",
            "Moins de corrections manuelles.",
            "Factures preparees depuis les heures deja suivies.",
            "Vision plus claire du temps par client.",
          ],
        },
        {
          heading: "La bonne transition",
          body: [
            "Il n'est pas necessaire de tout migrer d'un coup. Commencez par suivre les nouvelles sessions dans un outil, puis importez ou archivez l'historique utile.",
            "Le bon critere est simple : si votre systeme actuel vous fait perdre du temps chaque semaine, il ne remplit plus son role.",
          ],
        },
      ],
      faq: [
        {
          question: "Un tableur est-il moins professionnel ?",
          answer:
            "Non, tant qu'il reste fiable. Le probleme vient surtout des oublis, des doublons et du temps passe a consolider les donnees.",
        },
        {
          question: "Faut-il importer tout son historique ?",
          answer:
            "Pas toujours. Il suffit souvent de garder l'ancien tableur en archive et de commencer proprement avec les nouvelles sessions.",
        },
        {
          question: "Quel est le principal avantage d'un outil dedie ?",
          answer:
            "Le lien direct entre temps suivi, clients, projets, statistiques et facturation.",
        },
      ],
      cta: {
        title: "Passez du tableur au suivi connecte.",
        body:
          "Kronoma garde vos heures, clients, projets et factures dans un meme flux de travail.",
        href: "/pricing",
        label: "Voir Kronoma",
      },
    },
  },
  {
    translationKey: "freelance-time-tracking",
    locale: "en",
    slug: "how-to-track-working-time-as-a-freelancer",
    title: "How to track working time as a freelancer without adding friction",
    excerpt:
      "A simple method to record hours, keep client context, and turn tracked time into more reliable invoices.",
    metaTitle: "How to track working time as a freelancer | Kronoma Guide",
    metaDescription:
      "Learn a simple way to track freelance working time, avoid forgotten hours, and prepare invoices faster.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
    tags: ["Time tracking", "Freelance"],
    readingMinutes: 5,
    publishedDayOffset: 21,
    content: {
      intro:
        "Time tracking does not need to become heavy admin. For freelancers, the best system captures work when it happens and links it to a client, a project, and an invoice.",
      sections: [
        {
          heading: "Why track hours even when you charge fixed fees",
          body: [
            "Many freelancers only track time when they bill hourly. Time tracking still matters for fixed-fee work because it shows whether a project remains profitable.",
            "It also gives you objective context when a client asks for details and helps you estimate future projects with better data.",
          ],
          bullets: [
            "Spot projects that take longer than expected.",
            "Compare estimated time with real time.",
            "Build a better base for future quotes.",
          ],
        },
        {
          heading: "The four data points that are enough",
          body: [
            "A sustainable system should capture only what matters: date, client, project, and a short work note.",
            "Those four fields are usually enough to understand where time went and prepare a clear invoice without rebuilding the week from memory.",
          ],
        },
        {
          heading: "When a tool becomes better than a spreadsheet",
          body: [
            "A spreadsheet works at the beginning, but it becomes fragile when clients, projects, and invoices grow.",
            "A dedicated tool is useful when you want tracked hours to feed project stats and invoices without repeated manual consolidation.",
          ],
        },
      ],
      faq: [
        {
          question: "Do I need to track every minute?",
          answer:
            "No. The goal is reliable context, not minute-by-minute control. Clear sessions by task or work block are enough for most freelancers.",
        },
        {
          question: "Is time tracking useful for fixed-fee projects?",
          answer:
            "Yes. It helps measure real profitability and improve future estimates.",
        },
        {
          question: "How often should I log my hours?",
          answer:
            "Tracking while you work is best. If that is not possible, a daily review is far more accurate than reconstructing the month later.",
        },
      ],
      cta: {
        title: "Track hours without rebuilding your week.",
        body:
          "Kronoma links work sessions to clients, projects, and invoices so your activity stays clear.",
        href: "/pricing",
        label: "See plans",
      },
    },
  },
  {
    translationKey: "swiss-freelance-invoicing-hours",
    locale: "en",
    slug: "swiss-freelance-invoicing-from-tracked-hours",
    title: "Swiss freelance invoicing: how to turn tracked hours into an invoice",
    excerpt:
      "What to check before turning clean time records into a clear invoice, especially for Swiss-based freelancers.",
    metaTitle: "Swiss freelance invoicing from tracked hours | Kronoma",
    metaDescription:
      "A practical guide to turning tracked hours into a clear freelance invoice, with useful points for Swiss independents.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
    tags: ["Invoicing", "Switzerland"],
    readingMinutes: 6,
    publishedDayOffset: 14,
    content: {
      intro:
        "A reliable invoice starts before the invoice itself. It depends on clean tracked hours, clear work descriptions, and up-to-date client details.",
      sections: [
        {
          heading: "Link every hour to the right client",
          body: [
            "Unassigned hours are one of the most common sources of invoice errors. If a session is not linked to the right client or project, the invoice has to be rebuilt manually.",
            "Clean tracking keeps the connection between duration, project, and work note, so invoicing becomes a summary instead of detective work.",
          ],
        },
        {
          heading: "Make invoice lines easy to verify",
          body: [
            "An invoice does not need to list every minute, but it should be understandable. Group hours by service, project, or period depending on what helps the client validate it.",
            "Descriptions should be specific enough to remind the context without turning the invoice into a long report.",
          ],
        },
        {
          heading: "Swiss context: currency, payment details, and QR-bills",
          body: [
            "For a Swiss profile, company details, IBAN, currency, and invoice mentions should stay consistent between the business profile and the invoice.",
            "When payment is in CHF, a Swiss QR-bill can make payment easier for the client.",
          ],
        },
      ],
      faq: [
        {
          question: "Can I invoice several projects on one invoice?",
          answer:
            "Yes, if the invoice lines remain readable. Separating projects or service types often makes validation easier.",
        },
        {
          question: "Do I need to attach the full time detail?",
          answer:
            "Not always. A summary is often enough, but keeping details in your tool helps answer client questions quickly.",
        },
        {
          question: "Is a Swiss QR-bill mandatory?",
          answer:
            "It depends on the payment context. For Swiss freelancers invoicing in CHF, it can make payment more standardized.",
        },
      ],
      cta: {
        title: "Turn tracked hours into invoices faster.",
        body:
          "Kronoma keeps sessions, clients, and projects connected until invoice generation.",
        href: "/pricing",
        label: "Compare plans",
      },
    },
  },
  {
    translationKey: "freelance-hourly-rate",
    locale: "en",
    slug: "calculate-your-freelance-hourly-rate",
    title: "Calculate your freelance hourly rate without underselling your time",
    excerpt:
      "A simple way to connect revenue goals, costs, billable time, and real tracked hours before setting your rate.",
    metaTitle: "Calculate your freelance hourly rate | Kronoma",
    metaDescription:
      "Learn how to calculate a freelance hourly rate with revenue goals, costs, and realistic billable time.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1400&q=80",
    tags: ["Hourly rate", "Profitability"],
    readingMinutes: 5,
    publishedDayOffset: 7,
    content: {
      intro:
        "A freelance hourly rate is not just a desired salary divided by hours. It also needs to cover costs, non-billable work, admin, and quieter periods.",
      sections: [
        {
          heading: "Start from your annual revenue target",
          body: [
            "Define the income you want to reach over a year, then add professional costs, insurance, software subscriptions, and recurring expenses.",
            "This gives you the revenue that must be covered before estimating billable hours.",
          ],
        },
        {
          heading: "Separate worked hours from billable hours",
          body: [
            "Not every working hour is billable. Sales, admin, quotes, accounting, and learning all take time.",
            "Tracking time helps reveal how much of your week is actually spent on client work.",
          ],
        },
        {
          heading: "Adjust the rate with real data",
          body: [
            "The first calculation is only a hypothesis. After a few weeks, compare estimated time, real time, and the amount invoiced.",
            "If projects often overflow, the issue may be pricing, scope, or the type of work sold.",
          ],
        },
      ],
      faq: [
        {
          question: "What rate should I choose when starting out?",
          answer:
            "Start with your profitability threshold, then compare it with market rates in your specialty.",
        },
        {
          question: "Does my hourly rate need to appear on every invoice?",
          answer:
            "No. For fixed-fee work, you can invoice the service while tracking hours internally.",
        },
        {
          question: "When should I review my hourly rate?",
          answer:
            "Review it when tracked data shows that projects are less profitable than expected, or when your expertise and demand increase.",
        },
      ],
      cta: {
        title: "Measure profitability with reliable hours.",
        body:
          "Kronoma helps you understand real time spent by client and project before adjusting your rates.",
        href: "/auth/login",
        label: "Start for free",
      },
    },
  },
  {
    translationKey: "time-tracking-tool-vs-spreadsheet",
    locale: "en",
    slug: "time-tracking-tool-vs-spreadsheet-for-freelancers",
    title: "Time tracking tool or spreadsheet: what should freelancers choose?",
    excerpt:
      "A practical comparison to know when a spreadsheet is enough and when a dedicated tool becomes more profitable.",
    metaTitle: "Time tracking tool vs spreadsheet for freelancers | Kronoma",
    metaDescription:
      "Compare spreadsheets and time tracking tools for freelancers: simplicity, reliability, invoicing, and limits to anticipate.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    tags: ["Comparison", "Productivity"],
    readingMinutes: 4,
    publishedDayOffset: 3,
    content: {
      intro:
        "The best system is the one you keep using. A spreadsheet can work at first, but a dedicated tool becomes more useful when time records feed stats and invoicing.",
      sections: [
        {
          heading: "When a spreadsheet is enough",
          body: [
            "A spreadsheet is fine when you have few clients, few projects, and simple invoicing.",
            "Its limits appear when you need to retrieve project details, calculate reliable totals, or turn hours into invoices.",
          ],
        },
        {
          heading: "When a dedicated tool becomes more profitable",
          body: [
            "A time tracking tool is useful when manual entry creates errors or weekly consolidation takes too much time.",
            "The benefit is not only the timer. It is the link between session, client, project, statistics, and invoice.",
          ],
        },
        {
          heading: "The right transition",
          body: [
            "You do not need to migrate everything at once. Start tracking new sessions in the tool, then keep your old spreadsheet as an archive.",
            "The simple rule is this: if your current system costs time every week, it no longer does its job.",
          ],
        },
      ],
      faq: [
        {
          question: "Is a spreadsheet less professional?",
          answer:
            "No, as long as it remains reliable. The problem is usually forgotten entries, duplicates, and consolidation time.",
        },
        {
          question: "Do I need to import all my history?",
          answer:
            "Not always. Keeping the old spreadsheet as an archive and starting clean is often enough.",
        },
        {
          question: "What is the main benefit of a dedicated tool?",
          answer:
            "The direct link between tracked time, clients, projects, statistics, and invoicing.",
        },
      ],
      cta: {
        title: "Move from spreadsheet to connected tracking.",
        body:
          "Kronoma keeps hours, clients, projects, and invoices in one workflow.",
        href: "/pricing",
        label: "See Kronoma",
      },
    },
  },
];

const serviceTypes = [
  { name: "Strategie", color: "#F97316" },
  { name: "Design UX", color: "#14B8A6" },
  { name: "Developpement web", color: "#3B82F6" },
  { name: "Maintenance", color: "#A855F7" },
  { name: "Administration", color: "#EAB308" },
];

const clients = [
  {
    name: "Alpine Studio SA",
    email: "finance@alpine-studio.ch",
    address: "Avenue de la Gare 12",
    postalCode: "1003",
    city: "Lausanne",
    country: "CH",
    color: "#14B8A6",
    notes: "Client regulier pour design produit et landing pages.",
  },
  {
    name: "Helvetia Resto Sarl",
    email: "admin@helvetia-resto.ch",
    address: "Rue du Lac 4",
    postalCode: "1207",
    city: "Geneve",
    country: "CH",
    color: "#F97316",
    notes: "Refonte du site et support reservations.",
  },
  {
    name: "Nova Fiduciaire",
    email: "contact@nova-fiduciaire.ch",
    address: "Bahnhofstrasse 38",
    postalCode: "8001",
    city: "Zurich",
    country: "CH",
    color: "#3B82F6",
    notes: "Accompagnement digital et automatisations internes.",
  },
  {
    name: "GreenPeak Outdoor",
    email: "hello@greenpeak-outdoor.ch",
    address: "Route des Alpes 8",
    postalCode: "1950",
    city: "Sion",
    country: "CH",
    color: "#22C55E",
    notes: "E-commerce et campagnes saisonnieres.",
  },
  {
    name: "Maison Viret",
    email: "studio@maisonviret.ch",
    address: "Grand-Rue 21",
    postalCode: "1800",
    city: "Vevey",
    country: "CH",
    color: "#EC4899",
    notes: "Identite visuelle et supports commerciaux.",
  },
  {
    name: "Leman Legal",
    email: "office@lemanlegal.ch",
    address: "Quai Gustave-Ador 55",
    postalCode: "1207",
    city: "Geneve",
    country: "CH",
    color: "#6366F1",
    notes: "Maintenance et evolutions du portail client.",
  },
  {
    name: "Urban Move",
    email: "ops@urbanmove.ch",
    address: "Rue Centrale 9",
    postalCode: "2502",
    city: "Bienne",
    country: "CH",
    color: "#06B6D4",
    notes: "Application interne de planning.",
  },
];

const projects = [
  {
    name: "Portail client",
    description: "Espace prive pour suivi des dossiers et documents.",
    client: "Leman Legal",
    serviceType: "Developpement web",
  },
  {
    name: "Refonte site vitrine",
    description: "Design et integration du nouveau site marketing.",
    client: "Helvetia Resto Sarl",
    serviceType: "Design UX",
  },
  {
    name: "Dashboard finance",
    description: "Tableaux de bord internes pour suivi des mandats.",
    client: "Nova Fiduciaire",
    serviceType: "Developpement web",
  },
  {
    name: "Landing collection ete",
    description: "Page campagne et tracking conversion.",
    client: "GreenPeak Outdoor",
    serviceType: "Strategie",
  },
  {
    name: "Kit de marque",
    description: "Identite visuelle, typographies et templates commerciaux.",
    client: "Maison Viret",
    serviceType: "Design UX",
  },
  {
    name: "Audit UX SaaS",
    description: "Audit de parcours, recommandations et prototype.",
    client: "Alpine Studio SA",
    serviceType: "Strategie",
  },
  {
    name: "Maintenance mensuelle",
    description: "Corrections, mises a jour et monitoring.",
    client: "Alpine Studio SA",
    serviceType: "Maintenance",
  },
  {
    name: "Planning operations",
    description: "Prototype d'outil planning pour equipes terrain.",
    client: "Urban Move",
    serviceType: "Developpement web",
  },
  {
    name: "Administration interne",
    description: "Classement, preparation comptable et suivi administratif.",
    client: null,
    serviceType: "Administration",
  },
];

type InvoiceLine = [description: string, quantity: number, unitPrice: number];

type InvoicePlan = {
  monthOffset: number;
  day: number;
  client: string;
  project: string;
  status: InvoiceStatus;
  templateType: InvoiceTemplateType;
  title: string;
  subject: string;
  items: InvoiceLine[];
};

type UploadedInvoicePlan = {
  monthOffset: number;
  day: number;
  client: string;
  project: string;
  status: InvoiceStatus;
  displayNumber: string;
  fileUrl: string;
  total: number;
  notes: string;
};

const invoicePlans: InvoicePlan[] = [
  {
    monthOffset: -8,
    day: 12,
    client: "Alpine Studio SA",
    project: "Audit UX SaaS",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.MODERN,
    title: "Facture",
    subject: "Audit UX et recommandations produit",
    items: [
      ["Atelier cadrage et analyse parcours", 1, 690],
      ["Audit ecrans et rapport priorise", 1, 1280],
    ],
  },
  {
    monthOffset: -7,
    day: 8,
    client: "Maison Viret",
    project: "Kit de marque",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.CLASSIC,
    title: "Facture",
    subject: "Direction artistique et kit de marque",
    items: [
      ["Moodboard et exploration visuelle", 1, 720],
      ["Templates commerciaux", 4, 180],
      ["Guide d'utilisation", 1, 460],
    ],
  },
  {
    monthOffset: -6,
    day: 18,
    client: "Nova Fiduciaire",
    project: "Dashboard finance",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.MINIMAL,
    title: "Facture",
    subject: "Prototype dashboard finance",
    items: [
      ["Architecture information", 1, 540],
      ["Prototype interactif", 1, 1460],
      ["Session de revue", 2, 150],
    ],
  },
  {
    monthOffset: -5,
    day: 9,
    client: "GreenPeak Outdoor",
    project: "Landing collection ete",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.MODERN,
    title: "Facture",
    subject: "Landing page campagne ete",
    items: [
      ["Concept campagne", 1, 620],
      ["Design responsive", 1, 980],
      ["Integration tracking", 1, 360],
    ],
  },
  {
    monthOffset: -4,
    day: 23,
    client: "Leman Legal",
    project: "Portail client",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.CLASSIC,
    title: "Facture",
    subject: "Sprint portail client - fondations",
    items: [
      ["Setup projet et authentification", 1, 1250],
      ["Interface documents", 1, 1180],
      ["Coordination projet", 3, 140],
    ],
  },
  {
    monthOffset: -3,
    day: 6,
    client: "Helvetia Resto Sarl",
    project: "Refonte site vitrine",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.MODERN,
    title: "Facture",
    subject: "Refonte site vitrine - phase design",
    items: [
      ["Wireframes pages principales", 1, 860],
      ["Maquettes desktop et mobile", 1, 1340],
      ["Adaptations contenus", 1, 320],
    ],
  },
  {
    monthOffset: -3,
    day: 21,
    client: "Alpine Studio SA",
    project: "Maintenance mensuelle",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.MINIMAL,
    title: "Facture",
    subject: "Maintenance mensuelle",
    items: [
      ["Monitoring et corrections", 6, 120],
      ["Mises a jour dependances", 1, 280],
    ],
  },
  {
    monthOffset: -2,
    day: 7,
    client: "Urban Move",
    project: "Planning operations",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.MODERN,
    title: "Facture",
    subject: "Prototype planning operations",
    items: [
      ["Ateliers besoins metier", 2, 240],
      ["Prototype planning equipe", 1, 1640],
      ["Tests utilisateurs", 1, 520],
    ],
  },
  {
    monthOffset: -2,
    day: 24,
    client: "Nova Fiduciaire",
    project: "Dashboard finance",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.CLASSIC,
    title: "Facture",
    subject: "Dashboard finance - integrations",
    items: [
      ["Connecteurs donnees", 1, 1320],
      ["Vues synthese mensuelle", 1, 940],
      ["Documentation", 1, 260],
    ],
  },
  {
    monthOffset: -1,
    day: 4,
    client: "GreenPeak Outdoor",
    project: "Landing collection ete",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.MODERN,
    title: "Facture",
    subject: "Optimisations campagne",
    items: [
      ["Variantes A/B", 3, 220],
      ["Optimisation performance", 1, 480],
      ["Rapport de lancement", 1, 240],
    ],
  },
  {
    monthOffset: -1,
    day: 18,
    client: "Leman Legal",
    project: "Portail client",
    status: InvoiceStatus.SENT,
    templateType: InvoiceTemplateType.CLASSIC,
    title: "Facture",
    subject: "Sprint portail client - espace dossiers",
    items: [
      ["Workflow dossiers", 1, 1480],
      ["Composants interface", 1, 1260],
      ["Recette et corrections", 4, 125],
    ],
  },
  {
    monthOffset: 0,
    day: 3,
    client: "Helvetia Resto Sarl",
    project: "Refonte site vitrine",
    status: InvoiceStatus.PAID,
    templateType: InvoiceTemplateType.MODERN,
    title: "Facture",
    subject: "Integration site vitrine",
    items: [
      ["Integration Next.js", 1, 1560],
      ["Formulaire reservation", 1, 620],
      ["Optimisation SEO locale", 1, 340],
    ],
  },
  {
    monthOffset: 0,
    day: 11,
    client: "Alpine Studio SA",
    project: "Maintenance mensuelle",
    status: InvoiceStatus.SENT,
    templateType: InvoiceTemplateType.MINIMAL,
    title: "Facture",
    subject: "Maintenance mensuelle",
    items: [
      ["Support prioritaire", 4, 120],
      ["Corrections UI", 3, 120],
      ["Suivi technique", 1, 180],
    ],
  },
  {
    monthOffset: 0,
    day: 20,
    client: "Maison Viret",
    project: "Kit de marque",
    status: InvoiceStatus.DRAFT,
    templateType: InvoiceTemplateType.CLASSIC,
    title: "Brouillon facture",
    subject: "Declinaisons reseaux sociaux",
    items: [
      ["Templates social media", 6, 95],
      ["Export assets", 1, 180],
    ],
  },
  {
    monthOffset: 0,
    day: 24,
    client: "Urban Move",
    project: "Planning operations",
    status: InvoiceStatus.SENT,
    templateType: InvoiceTemplateType.MODERN,
    title: "Facture",
    subject: "Planning operations - iteration mobile",
    items: [
      ["Ecrans mobile", 1, 740],
      ["Regles planning", 1, 980],
      ["Revue produit", 2, 140],
    ],
  },
];

const uploadedInvoicePlans: UploadedInvoicePlan[] = [
  {
    monthOffset: -1,
    day: 27,
    client: "Nova Fiduciaire",
    project: "Dashboard finance",
    status: InvoiceStatus.PAID,
    displayNumber: "EXT-2026-041",
    fileUrl: "https://example.com/kronoma-demo/invoices/ext-2026-041.pdf",
    total: 840,
    notes: "Facture importee depuis un ancien outil.",
  },
  {
    monthOffset: 0,
    day: 15,
    client: "GreenPeak Outdoor",
    project: "Landing collection ete",
    status: InvoiceStatus.SENT,
    displayNumber: "EXT-2026-052",
    fileUrl: "https://example.com/kronoma-demo/invoices/ext-2026-052.pdf",
    total: 1260,
    notes: "Facture client importee pour historique.",
  },
];

const expenses = [
  {
    name: "Adobe Creative Cloud",
    amount: 67.9,
    recurrence: ExpenseRecurrence.MONTHLY,
    category: "Logiciels",
    color: "#F97316",
    notes: "Suite design utilisee pour les maquettes et exports.",
  },
  {
    name: "Figma Professional",
    amount: 18,
    recurrence: ExpenseRecurrence.MONTHLY,
    category: "Logiciels",
    color: "#14B8A6",
    notes: "Prototypes et librairies de composants.",
  },
  {
    name: "Hebergement Vercel",
    amount: 24,
    recurrence: ExpenseRecurrence.MONTHLY,
    category: "Infrastructure",
    color: "#111827",
    notes: "Hebergement projets clients et previews.",
  },
  {
    name: "Assurance RC professionnelle",
    amount: 420,
    recurrence: ExpenseRecurrence.ANNUAL,
    category: "Assurance",
    color: "#3B82F6",
    notes: "Couverture responsabilite civile professionnelle.",
  },
  {
    name: "Coworking Lausanne",
    amount: 280,
    recurrence: ExpenseRecurrence.MONTHLY,
    category: "Bureau",
    color: "#EAB308",
    notes: "Abonnement flexible 8 jours par mois.",
  },
  {
    name: "Formation accessibilite web",
    amount: 390,
    recurrence: ExpenseRecurrence.ONE_TIME,
    category: "Formation",
    color: "#A855F7",
    notes: "Workshop accessibilite et audit WCAG.",
  },
  {
    name: "Materiel bureau",
    amount: 246.5,
    recurrence: ExpenseRecurrence.ONE_TIME,
    category: "Materiel",
    color: "#22C55E",
    notes: "Support ordinateur, clavier et adaptateurs.",
  },
];

const toMoney = (value: number) => Math.round(value * 100) / 100;

function invoiceNumber(n: number) {
  return `INV-${String(n).padStart(3, "0")}`;
}

function subtotal(items: InvoiceLine[]) {
  return toMoney(
    items.reduce((sum, [, quantity, unitPrice]) => sum + quantity * unitPrice, 0)
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthDate(now: Date, monthOffset: number, day: number, hour = 10) {
  const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const safeDay = Math.min(day, 28);
  date.setDate(safeDay);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - day);
  return next;
}

export async function seedBlogPosts(client: PrismaClient, now = new Date()) {
  for (const post of blogPosts) {
    const publishedAt = addDays(now, -post.publishedDayOffset);

    await client.blogPost.upsert({
      where: {
        locale_slug: {
          locale: post.locale,
          slug: post.slug,
        },
      },
      update: {
        translationKey: post.translationKey,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        tags: post.tags,
        authorName: "Kronoma",
        readingMinutes: post.readingMinutes,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        status: BlogPostStatus.PUBLISHED,
        publishedAt,
      },
      create: {
        translationKey: post.translationKey,
        locale: post.locale,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        tags: post.tags,
        authorName: "Kronoma",
        readingMinutes: post.readingMinutes,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        status: BlogPostStatus.PUBLISHED,
        publishedAt,
      },
    });
  }
}

async function main() {
  const now = new Date();

  await seedBlogPosts(prisma, now);

  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new Error(
      `Aucun utilisateur trouve pour ${DEMO_EMAIL}. Cree d'abord ce compte dans Kronoma, puis relance npm run seed:demo.`
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: user.name || "Camille Morel",
      plan: UserPlan.PRO,
      currency: "CHF",
      hourlyRate: 125,
      onboardingCompletedAt: now,
      emailVerified: now,
    },
  });

  await prisma.businessProfile.upsert({
    where: { userId: user.id },
    update: BUSINESS,
    create: {
      userId: user.id,
      ...BUSINESS,
    },
  });

  const existingBankAccount = await prisma.bankAccount.findFirst({
    where: { userId: user.id, label: BANK_ACCOUNT.label },
  });

  if (existingBankAccount) {
    await prisma.bankAccount.update({
      where: { id: existingBankAccount.id },
      data: { ...BANK_ACCOUNT, isDefault: true },
    });
  } else {
    await prisma.bankAccount.create({
      data: {
        userId: user.id,
        ...BANK_ACCOUNT,
        isDefault: true,
      },
    });
  }

  const serviceTypeByName = new Map<string, string>();
  for (const serviceType of serviceTypes) {
    const record = await prisma.serviceType.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: serviceType.name,
        },
      },
      update: {
        color: serviceType.color,
      },
      create: {
        userId: user.id,
        ...serviceType,
      },
    });
    serviceTypeByName.set(record.name, record.id);
  }

  const clientByName = new Map<string, Awaited<ReturnType<typeof prisma.client.create>>>();
  for (const client of clients) {
    const record = await prisma.client.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: client.name,
        },
      },
      update: {
        email: client.email,
        address: client.address,
        postalCode: client.postalCode,
        city: client.city,
        country: client.country,
        color: client.color,
        notes: client.notes,
      },
      create: {
        userId: user.id,
        ...client,
      },
    });
    clientByName.set(record.name, record);
  }

  const projectByName = new Map<string, Awaited<ReturnType<typeof prisma.project.create>>>();
  for (const project of projects) {
    const client = project.client ? clientByName.get(project.client) : null;
    const serviceTypeId = serviceTypeByName.get(project.serviceType);
    const record = await prisma.project.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: project.name,
        },
      },
      update: {
        description: project.description,
        clientId: client?.id ?? null,
        serviceTypeId: serviceTypeId ?? null,
      },
      create: {
        userId: user.id,
        name: project.name,
        description: project.description,
        clientId: client?.id ?? null,
        serviceTypeId: serviceTypeId ?? null,
      },
    });
    projectByName.set(record.name, record);
  }

  await prisma.invoiceTemplate.upsert({
    where: {
      userId_name: {
        userId: user.id,
        name: "Modele demo sobre",
      },
    },
    update: {
      type: InvoiceTemplateType.CUSTOM,
      fileUrl: "https://example.com/kronoma-demo/templates/modele-demo.docx",
    },
    create: {
      userId: user.id,
      name: "Modele demo sobre",
      type: InvoiceTemplateType.CUSTOM,
      fileUrl: "https://example.com/kronoma-demo/templates/modele-demo.docx",
    },
  });

  const demoInvoiceCount = await prisma.invoice.count({
    where: {
      userId: user.id,
      senderName: BUSINESS.companyName,
      clientName: { in: clients.map((client) => client.name) },
    },
  });

  if (demoInvoiceCount === 0) {
    const lastInvoice = await prisma.invoice.findFirst({
      where: { userId: user.id },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    let nextNumber = (lastInvoice?.number ?? 0) + 1;

    for (const plan of invoicePlans) {
      const client = clientByName.get(plan.client);
      const project = projectByName.get(plan.project);
      if (!client) continue;

      const issueDate = monthDate(now, plan.monthOffset, plan.day);
      const dueDate = addDays(issueDate, 14);
      const amountSubtotal = subtotal(plan.items);

      await prisma.invoice.create({
        data: {
          userId: user.id,
          number: nextNumber,
          displayNumber: invoiceNumber(nextNumber),
          status: plan.status,
          source: InvoiceSource.GENERATED,
          clientId: client.id,
          projectId: project?.id ?? null,
          templateType: plan.templateType,
          senderName: BUSINESS.companyName,
          senderAddress: BUSINESS.address,
          senderPostalCode: BUSINESS.postalCode,
          senderCity: BUSINESS.city,
          senderCountry: BUSINESS.country,
          senderSiret: BUSINESS.siret,
          senderEmail: BUSINESS.email,
          senderPhone: BUSINESS.phone,
          senderVatMention: BUSINESS.vatMention,
          clientName: client.name,
          clientEmail: client.email,
          clientAddress: client.address,
          clientPostalCode: client.postalCode,
          clientCity: client.city,
          clientCountry: client.country,
          location: "Lausanne",
          title: plan.title,
          subject: plan.subject,
          bankName: BANK_ACCOUNT.bankName,
          iban: BANK_ACCOUNT.iban,
          bic: BANK_ACCOUNT.bic,
          paymentTerms: "Paiement a 14 jours par virement bancaire.",
          notes: "Merci pour votre confiance.",
          issueDate,
          dueDate,
          subtotal: amountSubtotal,
          taxRate: 0,
          taxAmount: 0,
          total: amountSubtotal,
          items: {
            create: plan.items.map(([description, quantity, unitPrice], index) => ({
              category: index === 0 ? "Prestation" : "Suivi",
              description,
              quantity,
              unitPrice,
              amount: toMoney(quantity * unitPrice),
              sortOrder: index,
            })),
          },
        },
      });
      nextNumber += 1;
    }

    for (const plan of uploadedInvoicePlans) {
      const client = clientByName.get(plan.client);
      const project = projectByName.get(plan.project);
      if (!client) continue;

      const issueDate = monthDate(now, plan.monthOffset, plan.day);

      await prisma.invoice.create({
        data: {
          userId: user.id,
          number: nextNumber,
          displayNumber: plan.displayNumber,
          status: plan.status,
          source: InvoiceSource.UPLOADED,
          fileUrl: plan.fileUrl,
          clientId: client.id,
          projectId: project?.id ?? null,
          templateType: InvoiceTemplateType.CLASSIC,
          clientName: client.name,
          clientEmail: client.email,
          clientAddress: client.address,
          clientPostalCode: client.postalCode,
          clientCity: client.city,
          clientCountry: client.country,
          issueDate,
          dueDate: addDays(issueDate, 14),
          notes: plan.notes,
          subtotal: plan.total,
          taxRate: 0,
          taxAmount: 0,
          total: plan.total,
        },
      });
      nextNumber += 1;
    }
  }

  const expenseByName = new Map<string, string>();
  for (const expense of expenses) {
    const existingExpense = await prisma.expense.findFirst({
      where: { userId: user.id, name: expense.name },
    });
    const data = {
      amount: expense.amount,
      recurrence: expense.recurrence,
      category: expense.category,
      notes: expense.notes,
      color: expense.color,
      isActive: true,
      startDate: monthDate(now, -5, 1),
    };
    const record = existingExpense
      ? await prisma.expense.update({
          where: { id: existingExpense.id },
          data,
        })
      : await prisma.expense.create({
          data: {
            userId: user.id,
            name: expense.name,
            ...data,
          },
        });
    expenseByName.set(record.name, record.id);

    const receiptCount = await prisma.expenseReceipt.count({
      where: { expenseId: record.id },
    });
    if (receiptCount === 0) {
      const receiptDates =
        expense.recurrence === ExpenseRecurrence.MONTHLY
          ? [-2, -1, 0]
          : expense.recurrence === ExpenseRecurrence.ANNUAL
          ? [-4]
          : [-1];

      for (const monthOffset of receiptDates) {
        const billedAt = monthDate(now, monthOffset, 5);
        const invoiceCode = `${expense.name
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 18)}-${billedAt.getFullYear()}-${String(
          billedAt.getMonth() + 1
        ).padStart(2, "0")}`;

        await prisma.expenseReceipt.create({
          data: {
            expenseId: record.id,
            invoiceNumber: invoiceCode,
            amount: expense.amount,
            billedAt,
            notes: "Recu ajoute pour la demo.",
            fileUrl: `https://example.com/kronoma-demo/receipts/${invoiceCode.toLowerCase()}.pdf`,
            fileName: `${invoiceCode}.pdf`,
          },
        });
      }
    }
  }

  const projectIds = Array.from(projectByName.values()).map((project) => project.id);
  const demoSessionCount = await prisma.workSession.count({
    where: {
      userId: user.id,
      projectId: { in: projectIds },
      startedAt: { gte: monthDate(now, -2, 1, 0) },
    },
  });

  if (demoSessionCount === 0) {
    const sessionProjects = [
      "Portail client",
      "Refonte site vitrine",
      "Dashboard finance",
      "Landing collection ete",
      "Maintenance mensuelle",
      "Planning operations",
      "Audit UX SaaS",
    ];
    const notes = [
      "Cadrage fonctionnel",
      "Design des ecrans principaux",
      "Integration et corrections",
      "Revue client",
      "Preparation livrables",
      "Optimisation responsive",
      "Suivi administratif",
    ];

    const weekStart = startOfWeek(now);
    const maxCurrentWeekDay = Math.min((now.getDay() + 6) % 7, 4);
    const sessionDays: Date[] = [];

    for (let weekOffset = -3; weekOffset <= 0; weekOffset += 1) {
      const maxDay = weekOffset === 0 ? maxCurrentWeekDay : 4;
      for (let dayIndex = 0; dayIndex <= maxDay; dayIndex += 1) {
        const date = addDays(weekStart, weekOffset * 7 + dayIndex);
        sessionDays.push(date);
      }
    }

    for (let index = 0; index < sessionDays.length; index += 1) {
      const date = sessionDays[index];
      const projectName = sessionProjects[index % sessionProjects.length];
      const project = projectByName.get(projectName);
      if (!project) continue;

      const client = projects.find((item) => item.name === projectName)?.client;
      const clientId = client ? clientByName.get(client)?.id : null;
      const start = new Date(date);
      start.setHours(8 + (index % 2), index % 3 === 0 ? 45 : 30, 0, 0);
      const durationHours = 3.5 + (index % 4) * 0.75;
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
      const breakStart = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const breakEnd = new Date(breakStart.getTime() + 20 * 60 * 1000);

      await prisma.workSession.create({
        data: {
          userId: user.id,
          status: WorkSessionStatus.ENDED,
          startedAt: start,
          endedAt: end,
          timezone: "Europe/Zurich",
          note: notes[index % notes.length],
          clientId: clientId ?? null,
          projectId: project.id,
          breaks: {
            create: {
              startedAt: breakStart,
              endedAt: breakEnd,
            },
          },
        },
      });
    }
  }

  const emailConnection = await prisma.emailConnection.upsert({
    where: {
      userId_provider_email: {
        userId: user.id,
        provider: EmailProvider.GMAIL,
        email: DEMO_EMAIL,
      },
    },
    update: {
      accessToken: "demo-access-token",
      refreshToken: "demo-refresh-token",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
    },
    create: {
      userId: user.id,
      provider: EmailProvider.GMAIL,
      email: DEMO_EMAIL,
      accessToken: "demo-access-token",
      refreshToken: "demo-refresh-token",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
    },
  });

  const detectedInvoices = [
    {
      providerMessageId: "demo-message-adobe-001",
      attachmentFileName: "adobe-creative-cloud.pdf",
      sender: "billing@adobe.com",
      subject: "Votre facture Adobe Creative Cloud",
      vendorName: "Adobe",
      totalAmount: 67.9,
      status: DetectedInvoiceStatus.IMPORTED,
      expense: "Adobe Creative Cloud",
    },
    {
      providerMessageId: "demo-message-coworking-001",
      attachmentFileName: "coworking-lausanne.pdf",
      sender: "factures@coworking-lausanne.ch",
      subject: "Facture abonnement coworking",
      vendorName: "Coworking Lausanne",
      totalAmount: 280,
      status: DetectedInvoiceStatus.PENDING,
      expense: null,
    },
    {
      providerMessageId: "demo-message-vercel-001",
      attachmentFileName: "vercel-hosting.pdf",
      sender: "billing@vercel.com",
      subject: "Invoice for your Vercel subscription",
      vendorName: "Vercel",
      totalAmount: 24,
      status: DetectedInvoiceStatus.IMPORTED,
      expense: "Hebergement Vercel",
    },
    {
      providerMessageId: "demo-message-newsletter-001",
      attachmentFileName: "newsletter-sponsor.pdf",
      sender: "hello@example.com",
      subject: "Document sans lien comptable",
      vendorName: "Newsletter sponsor",
      totalAmount: 0,
      status: DetectedInvoiceStatus.IGNORED,
      expense: null,
    },
  ];

  for (const detected of detectedInvoices) {
    const receivedAt = monthDate(now, 0, 8 + detectedInvoices.indexOf(detected), 9);
    await prisma.detectedInvoice.upsert({
      where: {
        emailConnectionId_providerMessageId_attachmentFileName: {
          emailConnectionId: emailConnection.id,
          providerMessageId: detected.providerMessageId,
          attachmentFileName: detected.attachmentFileName,
        },
      },
      update: {
        status: detected.status,
        createdExpenseId: detected.expense ? expenseByName.get(detected.expense) : null,
      },
      create: {
        userId: user.id,
        emailConnectionId: emailConnection.id,
        providerMessageId: detected.providerMessageId,
        sender: detected.sender,
        subject: detected.subject,
        receivedAt,
        attachmentFileName: detected.attachmentFileName,
        attachmentMimeType: "application/pdf",
        attachmentStorageUrl: `https://example.com/kronoma-demo/email-invoices/${detected.attachmentFileName}`,
        storageKey: `demo/${detected.attachmentFileName}`,
        extractedText: `${detected.vendorName} - montant ${detected.totalAmount} CHF`,
        vendorName: detected.vendorName,
        invoiceDate: receivedAt,
        dueDate: addDays(receivedAt, 14),
        currency: "CHF",
        subtotalAmount: detected.totalAmount,
        taxAmount: 0,
        totalAmount: detected.totalAmount,
        confidenceScore: detected.status === DetectedInvoiceStatus.IGNORED ? 0.62 : 0.93,
        status: detected.status,
        createdExpenseId: detected.expense ? expenseByName.get(detected.expense) : null,
      },
    });
  }

  const summary = await Promise.all([
    prisma.client.count({ where: { userId: user.id } }),
    prisma.project.count({ where: { userId: user.id } }),
    prisma.invoice.count({ where: { userId: user.id } }),
    prisma.expense.count({ where: { userId: user.id } }),
    prisma.workSession.count({ where: { userId: user.id } }),
    prisma.blogPost.count({ where: { status: BlogPostStatus.PUBLISHED } }),
  ]);

  console.log(`Compte demo rempli pour ${DEMO_EMAIL}`);
  console.log(
    `Total compte: ${summary[0]} clients, ${summary[1]} projets, ${summary[2]} factures, ${summary[3]} depenses, ${summary[4]} sessions, ${summary[5]} articles publies.`
  );
}

if (process.argv[1]?.endsWith("seed-demo.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
