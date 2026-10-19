import type { MetadataRoute } from "next";

import { SITE } from "@/config/site";

// Só páginas públicas. A área logada nunca entra no sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/cadastrar`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/entrar`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/termos`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
