import type { Metadata } from "next";

import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Termos de uso",
  alternates: { canonical: "/termos" },
};

// MODELO BASE — precisa de revisão jurídica antes do lançamento.
export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso" updatedAt="outubro de 2026">
      <p>
        Estes termos regulam o uso do Imobi Flow GO, um software de gestão (CRM) para imobiliárias e
        corretores de imóveis, oferecido como serviço pela internet. Ao criar uma conta, você
        concorda com estes termos.
      </p>

      <h2>1. Conta e imobiliária</h2>
      <ul>
        <li>Você é responsável pelas informações cadastradas e pela guarda da sua senha.</li>
        <li>
          O usuário que cria a imobiliária é o seu proprietário no sistema e define quem tem acesso
          e com quais permissões.
        </li>
        <li>Os dados de cada imobiliária são isolados e não são compartilhados com outras.</li>
      </ul>

      <h2>2. Teste grátis e planos</h2>
      <ul>
        <li>O teste grátis dura 14 dias, com todos os recursos, sem necessidade de cartão.</li>
        <li>Após o teste, o uso continua mediante a contratação de um plano mensal.</li>
        <li>Não há fidelidade: o cancelamento pode ser feito a qualquer momento.</li>
      </ul>

      <h2>3. Uso aceitável</h2>
      <ul>
        <li>
          É proibido usar o sistema para envio de mensagens em massa não solicitadas (spam) ou para
          qualquer finalidade ilegal.
        </li>
        <li>
          Você deve ter base legal (por exemplo, consentimento ou relação comercial) para tratar os
          dados dos seus clientes, nos termos da LGPD.
        </li>
      </ul>

      <h2>4. Seus dados</h2>
      <p>
        Os dados que você cadastra pertencem à sua imobiliária. Você pode exportá-los e solicitar a
        exclusão a qualquer momento. O tratamento de dados pessoais está descrito na Política de
        privacidade.
      </p>

      <h2>5. Disponibilidade e suporte</h2>
      <p>
        Trabalhamos para manter o serviço disponível e seguro, com backups periódicos. Manutenções
        programadas serão comunicadas com antecedência sempre que possível.
      </p>

      <h2>6. Contato</h2>
      <p>Dúvidas sobre estes termos podem ser enviadas pelos canais de suporte do produto.</p>
    </LegalPage>
  );
}
