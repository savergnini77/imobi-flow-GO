import type { Metadata } from "next";

import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Política de privacidade",
  alternates: { canonical: "/privacidade" },
};

// MODELO BASE — precisa de revisão jurídica antes do lançamento
// (incluindo a identificação do controlador e do encarregado/DPO).
export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade" updatedAt="outubro de 2026">
      <p>
        Esta política explica como o Imobi Flow GO trata dados pessoais, em conformidade com a Lei
        Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Papéis no tratamento</h2>
      <ul>
        <li>
          <strong>Dados da sua conta</strong> (nome, e-mail, telefone): o Imobi Flow GO é o
          controlador.
        </li>
        <li>
          <strong>Dados dos clientes da imobiliária</strong> (leads, proprietários, inquilinos): a
          imobiliária é a controladora e o Imobi Flow GO atua como operador, tratando os dados
          apenas para prestar o serviço.
        </li>
      </ul>

      <h2>2. Quais dados tratamos</h2>
      <ul>
        <li>Dados de cadastro: nome, e-mail, telefone, cargo e dados da imobiliária.</li>
        <li>Dados de uso: registros de acesso e de alterações, para segurança e auditoria.</li>
        <li>Dados inseridos pela imobiliária sobre seus contatos, imóveis e negócios.</li>
      </ul>

      <h2>3. Para que usamos</h2>
      <ul>
        <li>Prestar o serviço, autenticar o acesso e dar suporte.</li>
        <li>Garantir a segurança, prevenir fraudes e cumprir obrigações legais.</li>
        <li>Enviar comunicações sobre a conta (por exemplo, confirmação de e-mail e cobrança).</li>
      </ul>

      <h2>4. Segurança</h2>
      <p>
        Os dados de cada imobiliária são isolados no banco de dados, com controle de acesso por
        papel, conexão criptografada, histórico de alterações e backups.
      </p>

      <h2>5. Compartilhamento</h2>
      <p>
        Usamos fornecedores de infraestrutura (hospedagem, banco de dados, envio de e-mail e
        pagamentos) estritamente para operar o serviço. Não vendemos dados pessoais.
      </p>

      <h2>6. Seus direitos</h2>
      <p>
        Você pode solicitar confirmação, acesso, correção, portabilidade e exclusão dos seus dados,
        além de informações sobre o compartilhamento, pelos canais de suporte do produto.
      </p>

      <h2>7. Retenção</h2>
      <p>
        Mantemos os dados enquanto a conta estiver ativa e pelo prazo necessário para cumprir
        obrigações legais. Após o cancelamento, os dados da imobiliária podem ser exportados e
        depois são excluídos.
      </p>
    </LegalPage>
  );
}
