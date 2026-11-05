// Situação dos recursos do produto — fonte única para a landing e os planos.
// Quando um sprint entregar um recurso, troque para `true`: o selo "Em breve"
// some automaticamente da landing. Ver docs/MASTERPLAN.md para o cronograma.

export const FEATURES = {
  locations: true, // filiais e matriz (Sprint 1)
  permissions: true, // papéis e isolamento por imobiliária (Sprint 1)
  teams: false, // gestão de equipes e convites por e-mail (Sprint 2)
  contacts: false, // contatos + timeline (Sprint 3)
  import: false, // importação de planilha (Sprint 3)
  pipeline: false, // oportunidades em kanban (Sprint 4)
  whatsapp: false, // WhatsApp em um clique (Sprint 4)
  properties: false, // imóveis e captação (Sprint 5)
  propertyPage: false, // página pública do imóvel que gera lead (Sprint 5)
  agenda: false, // agenda de visitas e tarefas (Sprint 6)
  dashboard: false, // painel de desempenho (Sprint 6)
  leadDistribution: false, // distribuição automática de leads (Release 2)
  reports: false, // relatórios gerenciais (Release 2)
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isAvailable(feature: FeatureKey): boolean {
  return FEATURES[feature];
}
