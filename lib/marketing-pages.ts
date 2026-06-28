export type MarketingPageData = {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  lead: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  lastUpdated: string;
  summary: string;
  stats: Array<{ label: string; value: string }>;
  sections: Array<{
    eyebrow: string;
    title: string;
    body: string;
    points: string[];
  }>;
  comparison?: {
    title: string;
    rows: Array<{ label: string; kronoma: string; alternative: string }>;
  };
  faq: Array<{ q: string; a: string }>;
};

export const publicMarketingRoutes = [
  "/",
  "/pricing",
  "/about",
  "/features/time-tracking",
  "/features/facturation-freelance",
  "/features/qr-facture-suisse",
  "/use-cases/freelances",
  "/compare/excel",
  "/contact",
  "/legal/privacy",
  "/legal/terms",
] as const;

export const marketingPages = {
  timeTracking: {
    path: "/features/time-tracking",
    title: "Suivi du temps freelance | Kronoma",
    description:
      "Suivez vos heures facturables par client, projet et journee avec Kronoma, un logiciel de suivi du temps concu pour freelances et petites equipes.",
    eyebrow: "Fonction",
    heading: "Suivi du temps simple pour heures facturables.",
    lead:
      "Kronoma aide les freelances a enregistrer debut, pause, reprise et fin de session, puis a relier chaque heure au bon client ou projet.",
    primaryCta: "Essayer Pro 7 jours",
    primaryHref: "/auth/login?intent=checkout",
    secondaryCta: "Voir les tarifs",
    secondaryHref: "/pricing",
    lastUpdated: "Mis a jour en juin 2026",
    summary:
      "Le suivi du temps Kronoma remplace les notes manuelles par un chrono clair, un historique exploitable et des donnees pretes pour la facturation.",
    stats: [
      { label: "Usage principal", value: "Heures facturables" },
      { label: "Organisation", value: "Client + projet" },
      { label: "Sorties", value: "CSV, PDF, facture" },
    ],
    sections: [
      {
        eyebrow: "Definition",
        title: "Qu'est-ce que le suivi du temps dans Kronoma ?",
        body:
          "C'est un journal de travail structure qui garde les heures, les pauses et les reprises dans un historique consultable.",
        points: [
          "Chrono en temps reel pour demarrer et arreter une session.",
          "Association des sessions a un client ou a un projet.",
          "Historique utile pour verifier les heures avant facturation.",
        ],
      },
      {
        eyebrow: "Workflow",
        title: "Comment ca fonctionne",
        body:
          "Le flux reste volontairement court pour eviter l'administration lourde entre deux missions.",
        points: [
          "Lancez le chrono au debut de la mission.",
          "Ajoutez le client ou le projet concerne.",
          "Transformez les heures validees en facture ou en export.",
        ],
      },
    ],
    comparison: {
      title: "Kronoma face au suivi manuel",
      rows: [
        {
          label: "Precision",
          kronoma: "Sessions horodatees avec pauses",
          alternative: "Saisie approximative en fin de journee",
        },
        {
          label: "Facturation",
          kronoma: "Heures reliees aux factures",
          alternative: "Copier-coller depuis un tableur",
        },
        {
          label: "Controle",
          kronoma: "Historique par client et projet",
          alternative: "Fichiers disperses",
        },
      ],
    },
    faq: [
      {
        q: "Kronoma convient-il aux freelances ?",
        a: "Oui. Le produit est concu pour suivre des heures facturables par client et les transformer ensuite en facture.",
      },
      {
        q: "Peut-on suivre les pauses ?",
        a: "Oui. Les sessions peuvent etre mises en pause puis reprises afin de garder un temps facture plus propre.",
      },
    ],
  },
  invoicing: {
    path: "/features/facturation-freelance",
    title: "Facturation freelance | Kronoma",
    description:
      "Generez des factures depuis vos heures suivies, avec clients, projets, exports et options adaptees au pays.",
    eyebrow: "Fonction",
    heading: "Transformez vos heures en factures propres.",
    lead:
      "Kronoma relie le suivi du temps, les clients, les projets et la facturation pour reduire la ressaisie entre la mission et l'envoi de la facture.",
    primaryCta: "Creer une facture",
    primaryHref: "/auth/login",
    secondaryCta: "Comparer les plans",
    secondaryHref: "/pricing",
    lastUpdated: "Mis a jour en juin 2026",
    summary:
      "La facturation Kronoma sert a convertir des sessions de travail validees en documents exportables, avec une base client reutilisable.",
    stats: [
      { label: "Source", value: "Sessions suivies" },
      { label: "Documents", value: "PDF, DOCX" },
      { label: "Devise", value: "Selon profil" },
    ],
    sections: [
      {
        eyebrow: "Utilite",
        title: "Pourquoi relier temps et facture ?",
        body:
          "Le lien entre les sessions et les factures limite les oublis, clarifie les montants et garde une trace des heures envoyees au client.",
        points: [
          "Clients et projets centralises.",
          "Heures facturees plus faciles a justifier.",
          "Exports utiles pour l'administration et la comptabilite.",
        ],
      },
      {
        eyebrow: "Limites claires",
        title: "Ce que Kronoma ne remplace pas",
        body:
          "Kronoma aide a preparer et exporter les factures, mais ne remplace pas un conseil fiscal ou comptable adapte a votre situation.",
        points: [
          "Les mentions legales restent a verifier selon votre pays.",
          "Les parametres d'entreprise doivent etre complets.",
          "Les donnees comptables doivent etre controlees avant envoi.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on generer une facture depuis des heures suivies ?",
        a: "Oui. Les sessions de travail peuvent servir de base pour creer des factures liees a vos clients.",
      },
      {
        q: "Kronoma gere-t-il les clients ?",
        a: "Oui. Les clients peuvent etre crees, importes et reutilises dans les sessions, projets et factures.",
      },
    ],
  },
  qrBill: {
    path: "/features/qr-facture-suisse",
    title: "QR-facture suisse pour freelances | Kronoma",
    description:
      "Kronoma permet de generer une QR-facture suisse pour les profils bases en Suisse avec une devise CHF.",
    eyebrow: "Fonction Suisse",
    heading: "QR-facture suisse quand votre profil est compatible.",
    lead:
      "Pour les freelances suisses, Kronoma peut ajouter une QR-facture aux documents lorsque le profil business et la devise respectent les conditions requises.",
    primaryCta: "Configurer mon profil",
    primaryHref: "/auth/login",
    secondaryCta: "Voir les tarifs",
    secondaryHref: "/pricing",
    lastUpdated: "Mis a jour en juin 2026",
    summary:
      "La QR-facture suisse est disponible dans Kronoma pour les profils suisses en CHF; les autres profils gardent des factures internationales standard.",
    stats: [
      { label: "Pays", value: "Suisse" },
      { label: "Devise", value: "CHF" },
      { label: "Condition", value: "Profil complet" },
    ],
    sections: [
      {
        eyebrow: "Eligibilite",
        title: "Quand la QR-facture est-elle disponible ?",
        body:
          "Kronoma affiche les options QR-facture uniquement quand les informations du profil rendent cette sortie pertinente.",
        points: [
          "Profil business base en Suisse.",
          "Devise du compte en CHF.",
          "Coordonnees bancaires et donnees de facture completees.",
        ],
      },
      {
        eyebrow: "Transparence",
        title: "Pourquoi limiter cette option ?",
        body:
          "La QR-facture suisse repond a un contexte bancaire specifique. La limiter aux profils compatibles evite de proposer une sortie inappropriee.",
        points: [
          "Les profils non suisses utilisent des factures standard.",
          "Le fichier QR ne s'affiche pas quand les conditions ne sont pas remplies.",
          "Les informations de paiement restent a verifier avant transmission.",
        ],
      },
    ],
    faq: [
      {
        q: "Tous les comptes peuvent-ils creer une QR-facture suisse ?",
        a: "Non. Cette option est reservee aux profils business suisses avec une devise CHF.",
      },
      {
        q: "Que se passe-t-il pour un client hors Suisse ?",
        a: "Vous pouvez conserver une facture standard internationale quand la QR-facture suisse n'est pas adaptee.",
      },
    ],
  },
  freelancers: {
    path: "/use-cases/freelances",
    title: "Kronoma pour freelances | Suivi du temps et facturation",
    description:
      "Un workflow simple pour freelances: suivre les heures, organiser clients et projets, puis generer des factures exportables.",
    eyebrow: "Cas d'usage",
    heading: "Un espace clair pour les freelances qui facturent au temps.",
    lead:
      "Kronoma rassemble les gestes quotidiens du freelance: suivre une mission, retrouver les heures, gerer les clients et preparer la facture.",
    primaryCta: "Demarrer gratuitement",
    primaryHref: "/auth/login",
    secondaryCta: "Voir les fonctions",
    secondaryHref: "/features/time-tracking",
    lastUpdated: "Mis a jour en juin 2026",
    summary:
      "Kronoma convient aux freelances qui veulent une alternative plus structuree qu'un tableur pour suivre et facturer leurs heures.",
    stats: [
      { label: "Public", value: "Freelances" },
      { label: "Besoin", value: "Temps + facture" },
      { label: "Demarrage", value: "Compte gratuit" },
    ],
    sections: [
      {
        eyebrow: "Routine",
        title: "De la mission a la facture",
        body:
          "Le parcours est pense pour les semaines avec plusieurs clients, plusieurs projets et des heures a consolider rapidement.",
        points: [
          "Suivez chaque intervention au fil de la journee.",
          "Retrouvez les sessions par client avant facturation.",
          "Exportez les donnees utiles pour vous ou votre comptable.",
        ],
      },
      {
        eyebrow: "Migration",
        title: "Sortir progressivement d'Excel",
        body:
          "Kronoma peut importer des clients depuis un fichier Excel ou CSV afin de demarrer avec une base existante.",
        points: [
          "Import clients pour eviter la ressaisie.",
          "Organisation par client et projet.",
          "Historique centralise pour les prochains mois.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il une carte bancaire pour commencer ?",
        a: "Le plan Free permet de tester les bases sans engagement. Le plan Pro peut etre essaye 7 jours.",
      },
      {
        q: "Kronoma remplace-t-il mon tableur ?",
        a: "Il remplace surtout le suivi manuel des heures et la preparation repetitive des factures.",
      },
    ],
  },
  excelCompare: {
    path: "/compare/excel",
    title: "Kronoma vs Excel | Suivi du temps freelance",
    description:
      "Comparez Kronoma et Excel pour le suivi du temps, la gestion clients, la facturation et les exports freelance.",
    eyebrow: "Comparaison",
    heading: "Kronoma ou Excel pour suivre ses heures ?",
    lead:
      "Excel reste flexible, mais Kronoma apporte un workflow dedie quand les heures doivent devenir des factures fiables.",
    primaryCta: "Essayer Kronoma",
    primaryHref: "/auth/login",
    secondaryCta: "Voir les tarifs",
    secondaryHref: "/pricing",
    lastUpdated: "Mis a jour en juin 2026",
    summary:
      "Kronoma est plus adapte qu'un tableur lorsque le suivi du temps doit etre relie aux clients, aux projets et aux factures.",
    stats: [
      { label: "Excel", value: "Flexible" },
      { label: "Kronoma", value: "Structure" },
      { label: "Decision", value: "Facturation" },
    ],
    sections: [
      {
        eyebrow: "Choix",
        title: "Quand garder Excel",
        body:
          "Un tableur suffit pour quelques heures ponctuelles, peu de clients et aucun besoin de facture structuree.",
        points: [
          "Suivi occasionnel.",
          "Tres faible volume.",
          "Aucun besoin d'historique exploitable.",
        ],
      },
      {
        eyebrow: "Bascule",
        title: "Quand passer a Kronoma",
        body:
          "Kronoma devient plus pertinent quand les heures sont facturees regulierement et doivent rester tracables.",
        points: [
          "Plusieurs clients ou projets actifs.",
          "Besoin d'exports et de factures.",
          "Import clients pour demarrer plus vite.",
        ],
      },
    ],
    comparison: {
      title: "Comparatif rapide",
      rows: [
        {
          label: "Chrono",
          kronoma: "Debut, pause, reprise et fin",
          alternative: "Saisie manuelle",
        },
        {
          label: "Clients",
          kronoma: "Fiches clients reutilisables",
          alternative: "Lignes a maintenir",
        },
        {
          label: "Factures",
          kronoma: "Generation depuis les donnees",
          alternative: "Modele a remplir",
        },
      ],
    },
    faq: [
      {
        q: "Excel est-il suffisant pour demarrer ?",
        a: "Oui, pour un besoin tres simple. Kronoma devient utile lorsque vous facturez regulierement plusieurs clients.",
      },
      {
        q: "Peut-on importer des clients depuis Excel ?",
        a: "Oui. Kronoma accepte l'import Excel ou CSV pour creer des fiches clients plus rapidement.",
      },
    ],
  },
  contact: {
    path: "/contact",
    title: "Contact et support | Kronoma",
    description:
      "Contactez Kronoma pour les questions produit, support compte, facturation, QR-facture suisse et donnees.",
    eyebrow: "Contact",
    heading: "Un point d'entree clair pour les questions Kronoma.",
    lead:
      "La page contact centralise les demandes utiles: support produit, questions de facturation, acces au compte et informations commerciales.",
    primaryCta: "Se connecter",
    primaryHref: "/auth/login",
    secondaryCta: "Voir les tarifs",
    secondaryHref: "/pricing",
    lastUpdated: "Mis a jour en juin 2026",
    summary:
      "Pour les demandes liees a un compte, le plus fiable est de passer par votre espace Kronoma afin de garder le contexte client.",
    stats: [
      { label: "Support", value: "Compte Kronoma" },
      { label: "Sujet", value: "Produit + billing" },
      { label: "Public", value: "Freelances" },
    ],
    sections: [
      {
        eyebrow: "Demandes",
        title: "Quand utiliser cette page",
        body:
          "Elle sert a orienter les utilisateurs vers le bon canal selon le type de demande.",
        points: [
          "Question sur un abonnement, un essai Pro ou un paiement.",
          "Aide sur le suivi du temps, les clients, projets ou factures.",
          "Question sur la QR-facture suisse et les profils compatibles.",
        ],
      },
      {
        eyebrow: "Contexte",
        title: "Pour les demandes de compte",
        body:
          "Les demandes associees a des donnees de compte doivent etre faites depuis un espace connecte lorsque c'est possible.",
        points: [
          "Cela evite les confusions d'identite.",
          "Le support peut rattacher la question au bon compte.",
          "Les donnees sensibles ne doivent pas etre partagees publiquement.",
        ],
      },
    ],
    faq: [
      {
        q: "Ou demander de l'aide pour un abonnement ?",
        a: "Connectez-vous a Kronoma puis ouvrez l'espace abonnement afin de retrouver les options liees a Stripe et a votre plan.",
      },
      {
        q: "Puis-je poser une question avant de creer un compte ?",
        a: "Oui. La page contact sert de point d'entree public; les demandes liees a un compte peuvent ensuite etre redirigees vers l'espace connecte.",
      },
    ],
  },
  privacy: {
    path: "/legal/privacy",
    title: "Confidentialite | Kronoma",
    description:
      "Politique de confidentialite de Kronoma: compte, authentification, suivi du temps, clients, factures, fichiers, paiements et droits utilisateurs.",
    eyebrow: "Legal",
    heading: "Politique de confidentialite.",
    lead:
      "Cette politique explique quelles donnees Kronoma peut traiter pour fournir le service de suivi du temps, de gestion clients, de facturation et d'abonnement.",
    primaryCta: "Voir les tarifs",
    primaryHref: "/pricing",
    secondaryCta: "Contacter Kronoma",
    secondaryHref: "/contact",
    lastUpdated: "Mis a jour en juin 2026",
    summary:
      "Kronoma traite des donnees necessaires au compte, aux sessions de travail, aux clients, aux projets, aux factures et aux paiements.",
    stats: [
      { label: "Donnees", value: "Compte + factures" },
      { label: "Paiements", value: "Stripe" },
      { label: "Finalite", value: "Fournir le service" },
    ],
    sections: [
      {
        eyebrow: "Donnees collectees",
        title: "Categories de donnees traitees",
        body:
          "Kronoma collecte uniquement les informations utiles au fonctionnement du compte et des fonctionnalites activees par l'utilisateur.",
        points: [
          "Informations de compte: nom, adresse email, image de profil, methode de connexion et identifiants techniques.",
          "Donnees metier: clients, projets, sessions de travail, pauses, taux horaires, factures, depenses, banques et profil business.",
          "Fichiers importes ou generes: imports Excel ou CSV, factures, justificatifs, logos et documents exportes par l'utilisateur.",
        ],
      },
      {
        eyebrow: "Utilisation",
        title: "Pourquoi ces donnees sont utilisees",
        body:
          "Les donnees servent a fournir Kronoma, securiser l'acces, generer les documents demandes et ameliorer la fiabilite du produit.",
        points: [
          "Creer et gerer le compte, les sessions, clients, projets, factures, depenses et exports.",
          "Traiter les paiements, essais, abonnements, achats Lifetime et portails de facturation via Stripe.",
          "Mesurer la performance et la stabilite du site avec des donnees techniques limitees, notamment les Web Vitals et l'analytics applicatif.",
        ],
      },
      {
        eyebrow: "Services tiers",
        title: "Prestataires utilises",
        body:
          "Certaines fonctions reposent sur des services tiers. Ces services ne recoivent que les donnees necessaires a leur role.",
        points: [
          "Google ou email magique peuvent etre utilises pour l'authentification selon les options activees.",
          "Stripe gere les paiements, abonnements, clients Stripe, portails de facturation et confirmations de paiement.",
          "Cloudinary ou le stockage configure peuvent etre utilises pour les fichiers et images importes; Vercel peut traiter les donnees techniques d'hebergement et d'analytics.",
        ],
      },
      {
        eyebrow: "Gmail optionnel",
        title: "Connexion email et import de factures",
        body:
          "Si l'utilisateur connecte une boite Gmail pour l'import de factures, Kronoma utilise cet acces uniquement pour la fonction activee.",
        points: [
          "La connexion Gmail est optionnelle et peut etre deconnectee depuis l'application.",
          "Kronoma recherche des emails ou pieces jointes susceptibles de correspondre a des factures selon la fonction d'import.",
          "Aucune depense ne doit etre consideree comme definitive sans verification ou validation de l'utilisateur.",
        ],
      },
      {
        eyebrow: "Conservation",
        title: "Conservation et suppression",
        body:
          "Les donnees sont conservees tant que le compte existe ou aussi longtemps que necessaire pour fournir le service et respecter des obligations applicables.",
        points: [
          "L'utilisateur peut modifier ou supprimer certaines donnees depuis son espace.",
          "La suppression du compte peut entrainer la suppression ou l'anonymisation des donnees rattachees, sous reserve des contraintes techniques, legales ou comptables.",
          "Certaines donnees de paiement, facturation ou securite peuvent rester conservees par les prestataires ou dans des journaux techniques pendant une duree limitee.",
        ],
      },
      {
        eyebrow: "Droits",
        title: "Acces, correction et demandes",
        body:
          "L'utilisateur peut demander l'acces, la correction ou la suppression de ses donnees lorsque ces demandes sont applicables.",
        points: [
          "Les demandes liees au compte peuvent etre faites depuis l'espace connecte ou via la page contact.",
          "Kronoma peut demander une verification d'identite avant de traiter une demande sensible.",
          "Les demandes sont traitees dans un delai raisonnable, selon la nature de la demande et les obligations applicables.",
        ],
      },
    ],
    faq: [
      {
        q: "Kronoma stocke-t-il mes factures ?",
        a: "Kronoma peut stocker les donnees necessaires a la creation, l'export et l'historique de vos factures.",
      },
      {
        q: "Les paiements sont-ils traites directement par Kronoma ?",
        a: "Les paiements et informations de facturation sont traites via Stripe. Kronoma conserve les identifiants utiles pour relier un compte a son abonnement ou a son achat.",
      },
      {
        q: "Puis-je demander la suppression de mon compte ?",
        a: "Oui. La suppression peut etre demandee depuis l'application lorsque la fonction est disponible ou via contact. Certaines informations peuvent rester conservees si elles sont necessaires pour des raisons legales, comptables, de securite ou de preuve.",
      },
    ],
  },
  terms: {
    path: "/legal/terms",
    title: "Conditions d'utilisation | Kronoma",
    description:
      "Conditions d'utilisation de Kronoma pour le compte, le suivi du temps, la facturation, les exports, les abonnements, les achats Lifetime et les remboursements.",
    eyebrow: "Legal",
    heading: "Conditions d'utilisation de Kronoma.",
    lead:
      "Ces conditions definissent les regles de base d'utilisation de Kronoma, les responsabilites de l'utilisateur et les conditions applicables aux plans payants.",
    primaryCta: "Voir les tarifs",
    primaryHref: "/pricing",
    secondaryCta: "Confidentialite",
    secondaryHref: "/legal/privacy",
    lastUpdated: "Mis a jour en juin 2026",
    summary:
      "Kronoma fournit un SaaS de suivi du temps, gestion clients, projets, factures, depenses et exports; l'utilisateur reste responsable des informations qu'il saisit, verifie et transmet.",
    stats: [
      { label: "Service", value: "SaaS" },
      { label: "Plans", value: "Free, Pro, Lifetime" },
      { label: "Remboursement", value: "Au cas par cas" },
    ],
    sections: [
      {
        eyebrow: "Acceptation",
        title: "Objet du service",
        body:
          "Kronoma est un logiciel en ligne permettant de suivre le temps de travail, gerer des clients et projets, preparer des factures, suivre certaines depenses et exporter des donnees.",
        points: [
          "L'utilisation de Kronoma implique l'acceptation des presentes conditions.",
          "Le service peut evoluer avec de nouvelles fonctions, limites, corrections ou changements d'interface.",
          "Certaines fonctionnalites peuvent dependre du plan actif, de la configuration du compte ou de services tiers.",
        ],
      },
      {
        eyebrow: "Compte",
        title: "Responsabilites de l'utilisateur",
        body:
          "L'utilisateur est responsable des informations qu'il saisit dans Kronoma et de l'usage qu'il fait des documents generes.",
        points: [
          "Maintenir des informations de compte, profil business, clients, taux, taxes, devises et coordonnees bancaires exactes.",
          "Verifier les factures, QR-factures, exports, montants, mentions, taxes et conditions de paiement avant tout envoi a un tiers.",
          "Ne pas utiliser Kronoma pour des donnees illicites, trompeuses, frauduleuses, abusives ou contraires aux droits de tiers.",
        ],
      },
      {
        eyebrow: "Plans",
        title: "Offres, essais et paiements",
        body:
          "Kronoma peut proposer un plan gratuit, des plans payants, un essai Pro, un abonnement recurrent ou un achat Lifetime selon les offres visibles au moment de l'achat.",
        points: [
          "Les prix, limites et fonctionnalites applicables sont ceux affiches sur la page tarifs ou dans le parcours de paiement au moment de la souscription.",
          "Les paiements, abonnements, factures de paiement et portails de gestion peuvent etre traites par Stripe.",
          "Un essai gratuit peut devenir payant a la fin de la periode indiquee si l'utilisateur a fourni un moyen de paiement et n'a pas annule dans les delais.",
        ],
      },
      {
        eyebrow: "Remboursements",
        title: "Annulation et remboursements",
        body:
          "Sauf indication contraire obligatoire ou accord specifique, les frais deja payes ne sont pas rembourses automatiquement.",
        points: [
          "L'utilisateur peut annuler un abonnement futur depuis le portail de facturation lorsqu'il est disponible.",
          "L'annulation empeche les renouvellements futurs mais ne donne pas automatiquement droit au remboursement des frais deja regles.",
          "Un remboursement total ou partiel peut etre examine au cas par cas, notamment en cas d'erreur manifeste, incident technique important, double paiement ou situation exceptionnelle.",
        ],
      },
      {
        eyebrow: "Disponibilite",
        title: "Service, donnees et interruptions",
        body:
          "Kronoma fait des efforts raisonnables pour maintenir le service disponible, mais ne garantit pas un acces permanent, sans erreur ou sans interruption.",
        points: [
          "Le service peut etre interrompu temporairement pour maintenance, correction, incident, securite ou dependance a un prestataire tiers.",
          "L'utilisateur est invite a exporter ou sauvegarder les donnees importantes lorsque cela est necessaire a son activite.",
          "Kronoma ne remplace pas un conseil fiscal, comptable, juridique ou administratif personnalise.",
        ],
      },
      {
        eyebrow: "Facturation",
        title: "Documents generes et conformite",
        body:
          "Les documents generes par Kronoma sont des outils d'aide a la gestion. Leur exactitude finale depend des donnees saisies et de la verification de l'utilisateur.",
        points: [
          "L'utilisateur doit verifier les obligations applicables a son pays, son statut, sa TVA, ses mentions legales et ses conditions commerciales.",
          "Les QR-factures suisses sont proposees uniquement lorsque le profil et la devise sont compatibles avec cette fonctionnalite.",
          "Kronoma peut refuser, suspendre ou limiter un usage qui compromet le service, sa securite ou les droits d'autres utilisateurs.",
        ],
      },
    ],
    faq: [
      {
        q: "Qui verifie les factures avant envoi ?",
        a: "L'utilisateur reste responsable de verifier les informations legales, fiscales et bancaires avant d'envoyer une facture.",
      },
      {
        q: "Les frais deja payes sont-ils rembourses ?",
        a: "Non, pas automatiquement. Les remboursements peuvent etre analyses au cas par cas, par exemple en cas de double paiement, erreur manifeste ou incident important.",
      },
      {
        q: "Que se passe-t-il apres une annulation ?",
        a: "L'annulation arrete les renouvellements futurs selon les conditions du plan. L'acces aux fonctions payantes peut rester actif jusqu'a la fin de la periode deja payee, sauf indication contraire.",
      },
    ],
  },
} satisfies Record<string, MarketingPageData>;

type MarketingPageKey = keyof typeof marketingPages;

const englishMarketingPages = {
  timeTracking: {
    ...marketingPages.timeTracking,
    title: "Freelance time tracking | Kronoma",
    description:
      "Track billable hours by client, project and day with Kronoma, a time tracking app built for freelancers and small teams.",
    eyebrow: "Feature",
    heading: "Simple time tracking for billable hours.",
    lead:
      "Kronoma helps freelancers record start, pause, resume and end times, then connect every hour to the right client or project.",
    primaryCta: "Try Pro 7 days",
    secondaryCta: "See pricing",
    lastUpdated: "Updated in June 2026",
    summary:
      "Kronoma time tracking replaces manual notes with a clear timer, a usable history and data ready for invoicing.",
    stats: [
      { label: "Main use", value: "Billable hours" },
      { label: "Structure", value: "Client + project" },
      { label: "Outputs", value: "CSV, PDF, invoice" },
    ],
    sections: [
      {
        eyebrow: "Definition",
        title: "What is time tracking in Kronoma?",
        body:
          "It is a structured work log that keeps hours, breaks and resumes in a readable history.",
        points: [
          "Real-time timer to start and stop a work session.",
          "Sessions can be assigned to a client or project.",
          "History helps review hours before invoicing.",
        ],
      },
      {
        eyebrow: "Workflow",
        title: "How it works",
        body:
          "The flow stays intentionally short so freelancers do not add heavy admin between client work.",
        points: [
          "Start the timer when the work begins.",
          "Attach the session to the relevant client or project.",
          "Turn approved hours into an invoice or export.",
        ],
      },
    ],
    comparison: {
      title: "Kronoma compared with manual tracking",
      rows: [
        {
          label: "Accuracy",
          kronoma: "Timestamped sessions with breaks",
          alternative: "Approximate end-of-day entry",
        },
        {
          label: "Invoicing",
          kronoma: "Hours connected to invoices",
          alternative: "Copy and paste from a spreadsheet",
        },
        {
          label: "Control",
          kronoma: "History by client and project",
          alternative: "Scattered files",
        },
      ],
    },
    faq: [
      {
        q: "Is Kronoma suitable for freelancers?",
        a: "Yes. Kronoma is designed to track billable hours by client and turn them into invoices.",
      },
      {
        q: "Can I track breaks?",
        a: "Yes. Sessions can be paused and resumed so the billable time stays cleaner.",
      },
    ],
  },
  invoicing: {
    ...marketingPages.invoicing,
    title: "Freelance invoicing | Kronoma",
    description:
      "Generate invoices from tracked hours with clients, projects, exports and country-aware invoice options.",
    eyebrow: "Feature",
    heading: "Turn your hours into clean invoices.",
    lead:
      "Kronoma connects time tracking, clients, projects and invoicing to reduce repeated entry between work and invoice delivery.",
    primaryCta: "Create an invoice",
    secondaryCta: "Compare plans",
    lastUpdated: "Updated in June 2026",
    summary:
      "Kronoma invoicing converts approved work sessions into exportable documents with reusable client data.",
    stats: [
      { label: "Source", value: "Tracked sessions" },
      { label: "Documents", value: "PDF, DOCX" },
      { label: "Currency", value: "Profile based" },
    ],
    sections: [
      {
        eyebrow: "Use",
        title: "Why connect time and invoices?",
        body:
          "Linking sessions to invoices reduces forgotten work, clarifies amounts and keeps a trace of the hours sent to the client.",
        points: [
          "Clients and projects are centralized.",
          "Billed hours are easier to explain.",
          "Exports help with administration and accounting.",
        ],
      },
      {
        eyebrow: "Limits",
        title: "What Kronoma does not replace",
        body:
          "Kronoma helps prepare and export invoices, but it does not replace tax, legal or accounting advice for your situation.",
        points: [
          "Legal invoice details should be checked for your country.",
          "Business profile settings must be complete.",
          "Accounting data should be reviewed before sending.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I create an invoice from tracked hours?",
        a: "Yes. Work sessions can be used as the basis for invoices connected to your clients.",
      },
      {
        q: "Does Kronoma manage clients?",
        a: "Yes. Clients can be created, imported and reused in sessions, projects and invoices.",
      },
    ],
  },
  qrBill: {
    ...marketingPages.qrBill,
    title: "Swiss QR-bill for freelancers | Kronoma",
    description:
      "Kronoma can generate Swiss QR-bills for business profiles based in Switzerland with CHF as the account currency.",
    eyebrow: "Swiss feature",
    heading: "Swiss QR-bills when your profile is compatible.",
    lead:
      "For Swiss freelancers, Kronoma can add a Swiss QR-bill when the business profile and currency meet the required conditions.",
    primaryCta: "Configure my profile",
    secondaryCta: "See pricing",
    lastUpdated: "Updated in June 2026",
    summary:
      "Swiss QR-bills are available in Kronoma for Swiss CHF profiles; other profiles keep standard international invoices.",
    stats: [
      { label: "Country", value: "Switzerland" },
      { label: "Currency", value: "CHF" },
      { label: "Condition", value: "Complete profile" },
    ],
    sections: [
      {
        eyebrow: "Eligibility",
        title: "When is the Swiss QR-bill available?",
        body:
          "Kronoma shows QR-bill options only when the profile information makes this output relevant.",
        points: [
          "Business profile based in Switzerland.",
          "Account currency set to CHF.",
          "Bank details and invoice data completed.",
        ],
      },
      {
        eyebrow: "Transparency",
        title: "Why limit this option?",
        body:
          "Swiss QR-bills belong to a specific banking context. Limiting them to compatible profiles avoids offering the wrong output.",
        points: [
          "Non-Swiss profiles use standard invoices.",
          "The QR file is hidden when conditions are not met.",
          "Payment details should be checked before sharing.",
        ],
      },
    ],
    faq: [
      {
        q: "Can every account create a Swiss QR-bill?",
        a: "No. This option is reserved for Swiss business profiles with CHF as the currency.",
      },
      {
        q: "What happens for clients outside Switzerland?",
        a: "You can keep a standard international invoice when a Swiss QR-bill is not appropriate.",
      },
    ],
  },
  freelancers: {
    ...marketingPages.freelancers,
    title: "Kronoma for freelancers | Time tracking and invoicing",
    description:
      "A simple workflow for freelancers: track hours, organize clients and projects, then generate exportable invoices.",
    eyebrow: "Use case",
    heading: "A clear workspace for freelancers who bill time.",
    lead:
      "Kronoma brings together daily freelance work: track a mission, find the hours, manage clients and prepare the invoice.",
    primaryCta: "Start for free",
    secondaryCta: "See features",
    lastUpdated: "Updated in June 2026",
    summary:
      "Kronoma suits freelancers who want a more structured alternative to spreadsheets for tracking and invoicing hours.",
    stats: [
      { label: "Audience", value: "Freelancers" },
      { label: "Need", value: "Time + invoice" },
      { label: "Start", value: "Free account" },
    ],
    sections: [
      {
        eyebrow: "Routine",
        title: "From mission to invoice",
        body:
          "The flow is designed for weeks with several clients, several projects and hours that need to be consolidated quickly.",
        points: [
          "Track each intervention during the day.",
          "Review sessions by client before invoicing.",
          "Export useful data for yourself or your accountant.",
        ],
      },
      {
        eyebrow: "Migration",
        title: "Move gradually away from Excel",
        body:
          "Kronoma can import clients from an Excel or CSV file so you can start from an existing base.",
        points: [
          "Client import avoids repeated entry.",
          "Organization by client and project.",
          "Centralized history for future months.",
        ],
      },
    ],
    faq: [
      {
        q: "Do I need a card to start?",
        a: "The Free plan lets you test the basics without commitment. Pro can be tried for 7 days.",
      },
      {
        q: "Does Kronoma replace my spreadsheet?",
        a: "It mainly replaces manual time tracking and repetitive invoice preparation.",
      },
    ],
  },
  excelCompare: {
    ...marketingPages.excelCompare,
    title: "Kronoma vs Excel | Freelance time tracking",
    description:
      "Compare Kronoma and Excel for time tracking, client management, invoicing and freelance exports.",
    eyebrow: "Comparison",
    heading: "Kronoma or Excel to track your hours?",
    lead:
      "Excel stays flexible, but Kronoma provides a dedicated workflow when hours need to become reliable invoices.",
    primaryCta: "Try Kronoma",
    secondaryCta: "See pricing",
    lastUpdated: "Updated in June 2026",
    summary:
      "Kronoma is more suitable than a spreadsheet when time tracking must connect to clients, projects and invoices.",
    stats: [
      { label: "Excel", value: "Flexible" },
      { label: "Kronoma", value: "Structured" },
      { label: "Decision", value: "Invoicing" },
    ],
    sections: [
      {
        eyebrow: "Choice",
        title: "When to keep Excel",
        body:
          "A spreadsheet is enough for occasional hours, very few clients and no structured invoice workflow.",
        points: [
          "Occasional tracking.",
          "Very low volume.",
          "No need for usable history.",
        ],
      },
      {
        eyebrow: "Switch",
        title: "When to move to Kronoma",
        body:
          "Kronoma becomes more relevant when hours are billed regularly and need to stay traceable.",
        points: [
          "Several active clients or projects.",
          "Need for exports and invoices.",
          "Client import to start faster.",
        ],
      },
    ],
    comparison: {
      title: "Quick comparison",
      rows: [
        {
          label: "Timer",
          kronoma: "Start, pause, resume and stop",
          alternative: "Manual entry",
        },
        {
          label: "Clients",
          kronoma: "Reusable client records",
          alternative: "Rows to maintain",
        },
        {
          label: "Invoices",
          kronoma: "Generated from data",
          alternative: "Template to fill in",
        },
      ],
    },
    faq: [
      {
        q: "Is Excel enough to start?",
        a: "Yes, for a very simple need. Kronoma becomes useful when you regularly invoice several clients.",
      },
      {
        q: "Can I import clients from Excel?",
        a: "Yes. Kronoma accepts Excel or CSV imports to create client records faster.",
      },
    ],
  },
  contact: {
    ...marketingPages.contact,
    title: "Contact and support | Kronoma",
    description:
      "Contact Kronoma for product questions, account support, billing, Swiss QR-bills and data requests.",
    eyebrow: "Contact",
    heading: "A clear entry point for Kronoma questions.",
    lead:
      "The contact page centralizes useful requests: product support, billing questions, account access and commercial information.",
    primaryCta: "Sign in",
    secondaryCta: "See pricing",
    lastUpdated: "Updated in June 2026",
    summary:
      "For account-related requests, the most reliable path is to use your Kronoma workspace so the account context is preserved.",
    stats: [
      { label: "Support", value: "Kronoma account" },
      { label: "Topic", value: "Product + billing" },
      { label: "Audience", value: "Freelancers" },
    ],
    sections: [
      {
        eyebrow: "Requests",
        title: "When to use this page",
        body:
          "This page helps route users to the right channel depending on the type of request.",
        points: [
          "Question about a subscription, Pro trial or payment.",
          "Help with time tracking, clients, projects or invoices.",
          "Question about Swiss QR-bills and compatible profiles.",
        ],
      },
      {
        eyebrow: "Context",
        title: "For account requests",
        body:
          "Requests linked to account data should be made from a signed-in workspace whenever possible.",
        points: [
          "This avoids identity confusion.",
          "Support can connect the request to the right account.",
          "Sensitive data should not be shared publicly.",
        ],
      },
    ],
    faq: [
      {
        q: "Where can I ask for subscription help?",
        a: "Sign in to Kronoma and open the subscription area to access Stripe and plan options.",
      },
      {
        q: "Can I ask a question before creating an account?",
        a: "Yes. The contact page is a public entry point; account-specific requests can then be redirected to the signed-in workspace.",
      },
    ],
  },
  privacy: {
    ...marketingPages.privacy,
    title: "Privacy policy | Kronoma",
    description:
      "Kronoma privacy policy: account, authentication, time tracking, clients, invoices, files, payments and user rights.",
    eyebrow: "Legal",
    heading: "Privacy policy.",
    lead:
      "This policy explains what data Kronoma may process to provide time tracking, client management, invoicing and subscription features.",
    primaryCta: "See pricing",
    secondaryCta: "Contact Kronoma",
    lastUpdated: "Updated in June 2026",
    summary:
      "Kronoma processes data required for accounts, work sessions, clients, projects, invoices and payments.",
    stats: [
      { label: "Data", value: "Account + invoices" },
      { label: "Payments", value: "Stripe" },
      { label: "Purpose", value: "Provide service" },
    ],
    sections: [
      {
        eyebrow: "Data collected",
        title: "Categories of processed data",
        body:
          "Kronoma collects information needed to operate the account and the features enabled by the user.",
        points: [
          "Account information: name, email address, profile image, login method and technical identifiers.",
          "Business data: clients, projects, work sessions, breaks, hourly rates, invoices, expenses, bank accounts and business profile.",
          "Imported or generated files: Excel or CSV imports, invoices, receipts, logos and documents exported by the user.",
        ],
      },
      {
        eyebrow: "Use",
        title: "Why the data is used",
        body:
          "The data is used to provide Kronoma, secure access, generate requested documents and improve product reliability.",
        points: [
          "Create and manage accounts, sessions, clients, projects, invoices, expenses and exports.",
          "Process payments, trials, subscriptions, Lifetime purchases and billing portals through Stripe.",
          "Measure site performance and stability with limited technical data, including Web Vitals and app analytics.",
        ],
      },
      {
        eyebrow: "Third parties",
        title: "Services used",
        body:
          "Some features rely on third-party services. They receive only the data needed for their role.",
        points: [
          "Google or magic email links may be used for authentication depending on enabled options.",
          "Stripe handles payments, subscriptions, Stripe customers, billing portals and payment confirmations.",
          "Cloudinary or configured storage may be used for imported files and images; Vercel may process hosting and analytics technical data.",
        ],
      },
      {
        eyebrow: "Optional Gmail",
        title: "Email connection and invoice import",
        body:
          "If the user connects a Gmail inbox for invoice import, Kronoma uses this access only for the enabled feature.",
        points: [
          "Gmail connection is optional and can be disconnected from the app.",
          "Kronoma looks for emails or attachments likely to match invoices according to the import feature.",
          "No expense should be considered final without user review or validation.",
        ],
      },
      {
        eyebrow: "Retention",
        title: "Retention and deletion",
        body:
          "Data is kept while the account exists or as long as needed to provide the service and meet applicable obligations.",
        points: [
          "Users can edit or delete certain data from their workspace.",
          "Account deletion may delete or anonymize related data, subject to technical, legal or accounting constraints.",
          "Some payment, billing or security data may remain with providers or in technical logs for a limited time.",
        ],
      },
      {
        eyebrow: "Rights",
        title: "Access, correction and requests",
        body:
          "Users may request access, correction or deletion of their data where those requests apply.",
        points: [
          "Account-related requests can be made from the signed-in workspace or through the contact page.",
          "Kronoma may request identity verification before handling sensitive requests.",
          "Requests are handled within a reasonable time depending on the request and applicable obligations.",
        ],
      },
    ],
    faq: [
      {
        q: "Does Kronoma store my invoices?",
        a: "Kronoma may store the data needed to create, export and keep the history of your invoices.",
      },
      {
        q: "Are payments processed directly by Kronoma?",
        a: "Payments and billing information are processed through Stripe. Kronoma stores useful identifiers to connect an account to its subscription or purchase.",
      },
      {
        q: "Can I request account deletion?",
        a: "Yes. Deletion can be requested from the app when available or through contact. Some information may remain if needed for legal, accounting, security or evidence reasons.",
      },
    ],
  },
  terms: {
    ...marketingPages.terms,
    title: "Terms of use | Kronoma",
    description:
      "Kronoma terms of use for accounts, time tracking, invoicing, exports, subscriptions, Lifetime purchases and refunds.",
    eyebrow: "Legal",
    heading: "Kronoma terms of use.",
    lead:
      "These terms define the basic rules for using Kronoma, user responsibilities and paid plan conditions.",
    primaryCta: "See pricing",
    secondaryCta: "Privacy",
    lastUpdated: "Updated in June 2026",
    summary:
      "Kronoma provides SaaS tools for time tracking, clients, projects, invoices, expenses and exports; users remain responsible for the information they enter, review and share.",
    stats: [
      { label: "Service", value: "SaaS" },
      { label: "Plans", value: "Free, Pro, Lifetime" },
      { label: "Refunds", value: "Case by case" },
    ],
    sections: [
      {
        eyebrow: "Acceptance",
        title: "Purpose of the service",
        body:
          "Kronoma is online software for tracking work time, managing clients and projects, preparing invoices, tracking selected expenses and exporting data.",
        points: [
          "Using Kronoma means accepting these terms.",
          "The service may evolve with new features, limits, fixes or interface changes.",
          "Some features may depend on the active plan, account configuration or third-party services.",
        ],
      },
      {
        eyebrow: "Account",
        title: "User responsibilities",
        body:
          "Users are responsible for the information they enter in Kronoma and how they use generated documents.",
        points: [
          "Keep account, business profile, clients, rates, taxes, currencies and bank details accurate.",
          "Review invoices, QR-bills, exports, amounts, legal details, taxes and payment terms before sending anything to a third party.",
          "Do not use Kronoma for unlawful, misleading, fraudulent, abusive data or uses that infringe third-party rights.",
        ],
      },
      {
        eyebrow: "Plans",
        title: "Offers, trials and payments",
        body:
          "Kronoma may offer a free plan, paid plans, a Pro trial, a recurring subscription or a Lifetime purchase depending on the offer shown at checkout.",
        points: [
          "Applicable prices, limits and features are those shown on the pricing page or checkout flow when subscribing.",
          "Payments, subscriptions, payment invoices and billing portals may be handled by Stripe.",
          "A free trial may become paid at the end of the stated period if the user has provided a payment method and has not cancelled in time.",
        ],
      },
      {
        eyebrow: "Refunds",
        title: "Cancellation and refunds",
        body:
          "Unless otherwise required or specifically agreed, fees already paid are not automatically refunded.",
        points: [
          "Users can cancel future subscription renewals from the billing portal when available.",
          "Cancellation stops future renewals but does not automatically refund fees already paid.",
          "A full or partial refund may be reviewed case by case, especially for clear error, major technical incident, double payment or exceptional situation.",
        ],
      },
      {
        eyebrow: "Availability",
        title: "Service, data and interruptions",
        body:
          "Kronoma makes reasonable efforts to keep the service available, but does not guarantee permanent, error-free or uninterrupted access.",
        points: [
          "The service may be temporarily interrupted for maintenance, fixes, incidents, security or third-party dependency issues.",
          "Users should export or back up important data when needed for their business.",
          "Kronoma does not replace personalized tax, accounting, legal or administrative advice.",
        ],
      },
      {
        eyebrow: "Invoicing",
        title: "Generated documents and compliance",
        body:
          "Documents generated by Kronoma are management aids. Final accuracy depends on the data entered and user review.",
        points: [
          "Users must check the requirements that apply to their country, status, VAT, legal details and commercial terms.",
          "Swiss QR-bills are offered only when the profile and currency are compatible with that feature.",
          "Kronoma may refuse, suspend or limit use that compromises the service, security or other users' rights.",
        ],
      },
    ],
    faq: [
      {
        q: "Who checks invoices before sending?",
        a: "The user remains responsible for checking legal, tax and bank information before sending an invoice.",
      },
      {
        q: "Are paid fees refunded?",
        a: "No, not automatically. Refunds may be reviewed case by case, for example for a double payment, clear error or major incident.",
      },
      {
        q: "What happens after cancellation?",
        a: "Cancellation stops future renewals according to the plan terms. Paid features may remain active until the end of the already-paid period unless otherwise stated.",
      },
    ],
  },
} satisfies Record<MarketingPageKey, MarketingPageData>;

export const marketingPagesByLocale = {
  fr: marketingPages,
  en: englishMarketingPages,
} satisfies Record<string, Record<MarketingPageKey, MarketingPageData>>;

export function getMarketingPage(key: MarketingPageKey, locale: string) {
  return locale === "en" ? englishMarketingPages[key] : marketingPages[key];
}
