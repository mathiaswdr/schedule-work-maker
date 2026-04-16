import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kronoma",
    short_name: "Kronoma",
    description:
      "Logiciel suisse de suivi du temps pour freelances avec facturation et QR-facture suisse.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f1e6",
    theme_color: "#f97316",
    lang: "fr",
    categories: ["productivity", "business", "finance"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
    shortcuts: [
      {
        name: "Tableau de bord",
        short_name: "Dashboard",
        description: "Ouvrez votre vue d'ensemble et votre session active.",
        url: "/dashboard",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Tarifs",
        short_name: "Tarifs",
        description: "Comparez les offres et debloquez les fonctions avancees.",
        url: "/pricing",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
