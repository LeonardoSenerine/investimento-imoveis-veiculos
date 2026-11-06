import { X } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { SITE } from '../../config/site';

/**
 * Aviso de privacidade (modelo-base). ATENÇÃO: o texto precisa ser revisado
 * por assessoria jurídica e completado com a identificação do responsável
 * pelo tratamento antes da publicação.
 */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-charcoal/10 py-5 first:border-t-0 first:pt-0">
      <h3 className="font-display text-base font-semibold text-charcoal">{title}</h3>
      <div className="mt-2 space-y-2 text-[0.92rem] leading-relaxed text-charcoal/70">{children}</div>
    </section>
  );
}

export const PrivacyNotice = forwardRef<HTMLDialogElement>(function PrivacyNotice(_, ref) {
  const contact = SITE.privacyEmail ? (
    <>
      pelo e-mail <a className="font-semibold text-wood underline underline-offset-2" href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a>
    </>
  ) : (
    'pelo mesmo WhatsApp utilizado no atendimento'
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby="privacy-title"
      className="on-light m-auto max-h-[88svh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-[2px] bg-paper p-0 text-charcoal shadow-2xl backdrop:bg-charcoal/70 backdrop:backdrop-blur-sm open:animate-reveal-panel"
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="flex max-h-[88svh] flex-col">
        <header className="flex items-start justify-between gap-6 border-b border-charcoal/10 px-6 py-5 md:px-8">
          <div>
            <h2 id="privacy-title" className="font-display text-2xl font-semibold tracking-[-0.02em]">
              Aviso de privacidade
            </h2>
          </div>
          <form method="dialog">
            <button
              type="submit"
              aria-label="Fechar aviso de privacidade"
              className="grid size-11 place-items-center rounded-full border border-charcoal/15 transition-colors hover:bg-charcoal hover:text-offwhite"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </form>
        </header>

        <div className="overflow-y-auto px-6 py-6 md:px-8">
          <Block title="Quem trata seus dados">
            <p>
              Este site é mantido por um profissional de vendas de consórcios que atua como consultor comercial. Ele
              não é uma administradora de consórcios. Os planos são administrados por administradoras autorizadas
              pelo Banco Central do Brasil.
            </p>
          </Block>
          <Block title="Quais dados coletamos">
            <p>
              Nome e número de WhatsApp informados por você; os dados da simulação (categoria, crédito, prazo,
              parcela estimada e data); e a origem da visita (parâmetros de campanha como utm_source, página de
              entrada e referência).
            </p>
            <p>
              Quando ativas, ferramentas de medição (Google Tag Manager e Meta Pixel) podem registrar dados de
              navegação de forma agregada. Seu nome e telefone não são enviados a essas ferramentas.
            </p>
          </Block>
          <Block title="Para que usamos">
            <p>
              Para retornar o contato sobre a simulação realizada, apresentar informações e condições de planos de
              consórcio e medir o desempenho das campanhas. Não solicitamos CPF, documentos ou renda nesta etapa.
            </p>
          </Block>
          <Block title="Compartilhamento">
            <p>
              Seus dados não são vendidos. Eles só são compartilhados com uma administradora de consórcios se você
              decidir seguir com uma proposta, e na medida necessária para isso.
            </p>
          </Block>
          <Block title="Por quanto tempo">
            <p>
              Mantemos os dados enquanto houver atendimento em andamento ou até que você solicite a exclusão,
              respeitadas obrigações legais.
            </p>
          </Block>
          <Block title="Seus direitos">
            <p>
              Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar acesso, correção,
              exclusão ou a revogação do consentimento a qualquer momento, {contact}.
            </p>
          </Block>
          <p className="mt-2 text-xs text-charcoal/50">Versão {SITE.privacyNoticeVersion}</p>
        </div>
      </div>
    </dialog>
  );
});
