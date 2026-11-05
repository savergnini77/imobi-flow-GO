// Formatação de exibição das filiais (funções puras; servidor e cliente).

import type { Location } from "@/modules/locations/types";

/** "11987654321" -> "(11) 98765-4321"; "1133334444" -> "(11) 3333-4444". */
export function formatPhone(digits: string | null | undefined): string {
  if (!digits) return "";
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

/** "01310100" -> "01310-100". */
export function formatCep(digits: string | null | undefined): string {
  if (!digits) return "";
  const d = digits.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : digits;
}

/** Máscara progressiva enquanto o usuário digita o telefone. */
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Máscara progressiva do CEP. */
export function maskCep(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** "São Paulo / SP" (ou só o que existir). */
export function formatCityState(location: Pick<Location, "city" | "state">): string {
  return [location.city, location.state].filter(Boolean).join(" / ");
}

/** Endereço em uma linha: "Av. Paulista, 1000 - Bela Vista, São Paulo / SP". */
export function formatAddress(location: Location): string {
  const streetLine = [location.street, location.number].filter(Boolean).join(", ");
  const withComplement = [streetLine, location.complement].filter(Boolean).join(" ");
  const local = [withComplement, location.neighborhood].filter(Boolean).join(" - ");
  return [local, formatCityState(location)].filter(Boolean).join(", ");
}

/** Link do Google Maps a partir do endereço (sem chave de API). */
export function mapsUrl(location: Location): string | null {
  const address = formatAddress(location);
  if (!address) return null;
  const query = [address, formatCep(location.cep), "Brasil"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Link do WhatsApp (wa.me) a partir dos dígitos. */
export function whatsappUrl(digits: string | null | undefined): string | null {
  if (!digits) return null;
  return `https://wa.me/55${digits.replace(/\D/g, "")}`;
}
