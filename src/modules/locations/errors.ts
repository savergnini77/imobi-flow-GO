// Tradução dos erros do banco (PostgREST/Postgres) para mensagens em PT-BR.
// Nunca repassa a mensagem crua do banco ao usuário.

export type PostgrestErrorLike = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
};

export const GENERIC_LOCATION_ERROR =
  "Não foi possível concluir a ação. Tente novamente em instantes.";

/** Resultado do mapeamento: mensagem geral ou erro em um campo específico. */
export type MappedLocationError = { field?: string; message: string };

export function mapLocationDbError(
  error: PostgrestErrorLike | null | undefined,
): MappedLocationError {
  if (!error) return { message: GENERIC_LOCATION_ERROR };
  const text = `${error.message ?? ""} ${error.details ?? ""}`;

  switch (error.code) {
    case "LC001":
      return {
        message:
          "A matriz não pode ser desativada nem excluída. Defina outra filial como matriz antes.",
      };
    case "LC002":
      return {
        message:
          "Esta filial tem corretores ou equipes vinculados. Remova os vínculos ou desative a filial.",
      };
    case "LC003":
      return { message: "Reative a filial antes de defini-la como matriz." };
    case "23505":
      if (text.includes("locations_company_code_uq")) {
        return { field: "code", message: "Já existe uma filial com este código." };
      }
      if (text.includes("location_members_location_user_uq")) {
        return { message: "Esta pessoa já está nesta filial." };
      }
      return { field: "name", message: "Já existe uma filial com este nome." };
    case "23503":
      return {
        message: "Registro relacionado não encontrado. Atualize a página e tente novamente.",
      };
    case "23514":
      return { message: "Dados inválidos. Confira os campos e tente novamente." };
    case "42501":
      return { message: "Você não tem permissão para esta ação." };
    case "PGRST116":
      return { message: "Filial não encontrada." };
    default:
      return { message: GENERIC_LOCATION_ERROR };
  }
}
