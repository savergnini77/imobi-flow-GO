// Tradução dos erros das RPCs de convite para mensagens em PT-BR.
// Nunca repassa a mensagem crua do banco ao usuário.

export type PostgrestErrorLike = { code?: string | null; message?: string | null };

const GENERIC = "Não foi possível aceitar o convite. Tente novamente em instantes.";

export function mapInvitationError(error: PostgrestErrorLike | null | undefined): string {
  if (!error) return GENERIC;
  const message = error.message ?? "";
  switch (error.code) {
    case "28000":
      return "Sua sessão expirou. Entre novamente.";
    case "42501":
      return "Este convite foi enviado para outro e-mail. Entre com a conta do e-mail convidado.";
    case "P0002":
      return "Convite inválido. Confira o link ou peça um novo convite.";
    case "P0001":
      if (message.includes("expirou")) return "Este convite expirou. Peça um novo convite.";
      if (message.includes("utilizado")) return "Este convite já foi utilizado.";
      return "Este convite não está mais disponível. Peça um novo convite.";
    default:
      return GENERIC;
  }
}
