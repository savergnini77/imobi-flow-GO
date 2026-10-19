// Dados públicos do produto usados na landing, metadata, sitemap e OG image.

export const SITE = {
  name: "Imobi Flow GO",
  tagline: "O CRM da imobiliária que não deixa lead esfriar",
  description:
    "CRM imobiliário para organizar contatos, imóveis, visitas e equipes em um só lugar. Atenda pelo WhatsApp em um clique e acompanhe cada negócio até o fechamento.",
  url: (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/+$/, ""),
  trialDays: 14,
  locale: "pt_BR",
} as const;
