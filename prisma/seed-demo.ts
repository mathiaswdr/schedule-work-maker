import "dotenv/config";

import {
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

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new Error(
      `Aucun utilisateur trouve pour ${DEMO_EMAIL}. Cree d'abord ce compte dans Kronoma, puis relance npm run seed:demo.`
    );
  }

  const now = new Date();

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
  ]);

  console.log(`Compte demo rempli pour ${DEMO_EMAIL}`);
  console.log(
    `Total compte: ${summary[0]} clients, ${summary[1]} projets, ${summary[2]} factures, ${summary[3]} depenses, ${summary[4]} sessions.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
