import { LegalLayout } from "@/components/marketing/LegalLayout"

export const metadata = {
  title: "Termos de Uso · Matriz Aprova",
  description: "Termos de Uso da plataforma Matriz Aprova.",
}

const secao = "mt-10"
const h2 = "font-display font-bold text-lg text-ink dark:text-paper mb-3"
const paragrafo = "text-sm leading-relaxed mb-3"
const lista = "list-disc list-inside space-y-1.5 text-sm leading-relaxed mb-3"

export default function TermosPage() {
  return (
    <LegalLayout>
      <h1 className="font-display font-bold text-3xl text-ink dark:text-paper mb-2">Termos de Uso</h1>
      <p className="text-sm text-ink/50 dark:text-paper/50">Última atualização: agosto de 2026</p>

      <section className={secao}>
        <h2 className={h2}>1. Aceitação dos termos</h2>
        <p className={paragrafo}>
          Ao criar uma conta ou utilizar a plataforma Matriz Aprova, você declara ter lido, compreendido e
          concordado com estes Termos de Uso e com a Política de Privacidade. Se não concordar com qualquer parte
          destes termos, não utilize o serviço.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>2. Descrição do serviço</h2>
        <p className={paragrafo}>
          A Matriz Aprova é uma plataforma de estudos que combina banco de questões, simulados e recursos de
          inteligência artificial para auxiliar usuários na preparação para concursos públicos, OAB, concursos
          militares e ENEM. A plataforma não garante aprovação em qualquer seleção.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>3. Cadastro e conta</h2>
        <p className={paragrafo}>
          Você é responsável por manter a confidencialidade dos seus dados de acesso e por todas as atividades
          realizadas na sua conta. Você deve fornecer informações verdadeiras e manter seus dados atualizados. A
          Matriz Aprova pode suspender contas que utilizem informações falsas ou que violem estes termos.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>4. Assinatura, cobrança e reembolso</h2>
        <p className={paragrafo}>
          O plano é contratado em pagamento único com acesso vitalício. Você paga uma vez e o acesso permanece
          ativo sem renovação automática ou cobranças recorrentes. Em caso de arrependimento dentro de 7 dias após
          a compra, o valor será integralmente reembolsado conforme o Código de Defesa do Consumidor.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>5. Uso aceitável</h2>
        <p className={paragrafo}>Ao utilizar a plataforma, você concorda em não:</p>
        <ul className={lista}>
          <li>compartilhar sua conta ou credenciais com terceiros;</li>
          <li>manipular resultados de simulados, rankings ou estatísticas;</li>
          <li>reproduzir, redistribuir ou revender o conteúdo sem autorização;</li>
          <li>utilizar a plataforma para atividades ilícitas ou fraudulentas.</li>
        </ul>
      </section>

      <section className={secao}>
        <h2 className={h2}>6. Propriedade intelectual</h2>
        <p className={paragrafo}>
          Todo o conteúdo da plataforma — questões, textos, recursos visuais, marca e software — é propriedade da
          Matriz Aprova Tecnologia Educacional LTDA ou de seus licenciantes e está protegido pelas leis de
          propriedade intelectual. O uso é concedido em caráter pessoal e intransferível.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>7. Limitação de responsabilidade</h2>
        <p className={paragrafo}>
          A plataforma é fornecida {"\"no estado em que se encontra\""}. A Matriz Aprova não se responsabiliza por
          danos diretos ou indiretos decorrentes do uso ou da impossibilidade de uso do serviço, incluindo
          interrupções técnicas. O conteúdo de questões e gabaritos é oferecido para fins de estudo e pode conter
          erros.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>8. Alterações nos termos</h2>
        <p className={paragrafo}>
          Podemos atualizar estes Termos de Uso periodicamente. Alterações relevantes serão comunicadas por e-mail
          ou por aviso na plataforma. O uso continuado do serviço após a publicação das alterações implica
          concordância com a nova versão.
        </p>
      </section>

      <section className={secao}>
        <h2 className={h2}>9. Contato</h2>
        <p className={paragrafo}>
          Dúvidas sobre estes Termos de Uso podem ser enviadas para{" "}
          <a href="mailto:suporte@matrizaprova.com" className="text-lime-dark dark:text-lime hover:underline">suporte@matrizaprova.com</a>.
        </p>
      </section>
    </LegalLayout>
  )
}
