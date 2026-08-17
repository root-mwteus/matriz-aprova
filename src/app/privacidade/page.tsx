import { LegalLayout } from "@/components/marketing/LegalLayout"

export const metadata = {
  title: "Política de Privacidade · Matriz Aprova",
  description: "Política de Privacidade da plataforma Matriz Aprova.",
}

const secao = "mt-10"
const h2 = "font-display font-bold text-lg text-ink dark:text-paper mb-3"
const paragrafo = "text-sm leading-relaxed mb-3"
const lista = "list-disc list-inside space-y-1.5 text-sm leading-relaxed mb-3"

export default function PrivacidadePage() {
  return (
    <LegalLayout>
      <h1 className="font-display font-bold text-3xl text-ink dark:text-paper mb-2">Política de Privacidade</h1>
      <p className="text-sm text-ink/50 dark:text-paper/50">Última atualização: agosto de 2026</p>

      <section className={secao}>
        <h2 className={h2}>1. Dados que coletamos</h2>
        <p className={paragrafo}>Coletamos os seguintes dados:</p>
        <ul className={lista}>
          <li>dados de cadastro: nome, e-mail e senha criptografada;</li>
          <li>dados de uso: questões respondidas, acertos, erros, simulados e histórico de estudos;</li>
          <li>dados de pagamento: processados por intermediário de pagamento, sem armazenamento de dados do cartão;</li>
          <li>dados técnicos: endereço IP e dados de navegação utilizados para segurança e análise.</li>
        </ul>
      </section>

      <section className={secao}>
        <h2 className={h2}>2. Como usamos seus dados</h2>
        <p className={paragrafo}>
          Utilizamos seus dados para personalizar o plano de estudos, gerar recomendações com inteligência
          artificial, calcular estatísticas e rankings, processar pagamentos, enviar comunicações importantes sobre
          a conta e melhorar a plataforma.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>3. Compartilhamento</h2>
        <p className={paragrafo}>
          Não vendemos seus dados pessoais. Seus dados são compartilhados apenas com prestadores de serviço
          essenciais (hospedagem, autenticação, processamento de pagamentos e envio de e-mails), que estão sujeitos
          a obrigações de confidencialidade, ou quando exigido por lei.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>4. Segurança</h2>
        <p className={paragrafo}>
          Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito e
          em repouso e controle de acesso restrito. Nenhum método de transmissão ou armazenamento é totalmente
          seguro, e não podemos garantir segurança absoluta.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>5. Seus direitos (LGPD)</h2>
        <p className={paragrafo}>
          Nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode solicitar a qualquer momento a
          confirmação da existência de tratamento, o acesso, a correção, a anonimização ou a eliminação dos seus
          dados, além da portabilidade e da revogação do consentimento. Para exercer seus direitos, contate-nos pelo
          e-mail abaixo.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>6. Retenção e exclusão</h2>
        <p className={paragrafo}>
          Mantemos seus dados enquanto sua conta estiver ativa ou pelo tempo necessário para cumprir obrigações
          legais. Você pode solicitar a exclusão da sua conta e dos dados associados a qualquer momento; alguns dados
          poderão ser retidos por período adicional quando exigido por lei.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>7. Cookies e tecnologias similares</h2>
        <p className={paragrafo}>
          Utilizamos cookies e tecnologias similares para autenticação, segurança e melhoria da experiência.
          Você pode gerenciar as preferências de cookies no seu navegador, mas algumas funcionalidades podem deixar
          de funcionar sem eles.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>8. Alterações nesta política</h2>
        <p className={paragrafo}>
          Podemos atualizar esta Política de Privacidade periodicamente. Alterações relevantes serão comunicadas por
          e-mail ou por aviso na plataforma.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>9. Contato</h2>
        <p className={paragrafo}>
          Para questões sobre privacidade e tratamento de dados, fale conosco pelo e-mail{" "}
          <a href="mailto:suporte@matrizaprova.com" className="text-lime-dark dark:text-lime hover:underline">suporte@matrizaprova.com</a>.
        </p>
      </section>
    </LegalLayout>
  )
}
