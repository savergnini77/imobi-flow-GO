import { ImageResponse } from "next/og";

import { SITE } from "@/config/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagem de compartilhamento (WhatsApp, LinkedIn, etc.), gerada no build.
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #0b1324 0%, #10233a 60%, #064e3b 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "#10b981",
            display: "flex",
          }}
        />
        <div style={{ fontSize: 36, fontWeight: 600 }}>{SITE.name}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>
          Pare de perder lead no WhatsApp.
        </div>
        <div style={{ fontSize: 32, color: "rgba(255,255,255,0.75)", maxWidth: 940 }}>
          CRM para imobiliárias: contatos, imóveis, visitas e equipe em um só lugar.
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 28, color: "#6ee7b7" }}>
        {`Teste grátis por ${SITE.trialDays} dias · sem cartão`}
      </div>
    </div>,
    size,
  );
}
