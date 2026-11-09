import { MessageCircle, Phone, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { OBJECTIVES, SIMULATION_DISCLAIMER } from '../config/simulators';
import { SITE } from '../config/site';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { getAttribution } from '../lib/attribution';
import { headlineCents } from '../lib/calculator';
import { cn } from '../lib/cn';
import { formatCents, formatReais, splitCents } from '../lib/money';
import { track } from '../lib/tracking';
import { resultMessage, whatsappDisplay, whatsappUrl } from '../lib/whatsapp';
import { submitLead } from '../services/leadService';
import type { Contact, SimulationResult } from '../types';
import { SceneBackground } from './SceneBackground';
import { ButtonLink } from './ui/Button';

interface Props {
  result: SimulationResult;
  contact: Contact | null;
  honeypot: string;
  onRestart: () => void;
}


export function ResultPage({ result, contact, honeypot, onRestart }: Props) {
  const { quote: q } = result;
  const obj = OBJECTIVES[q.objective];
  const main = headlineCents(q);
  const first = contact?.name;

  // Contagem animada do valor mensal (em centavos, arredondada a cada quadro).
  const shown = useAnimatedNumber(Number(main), { duration: 1400 });
  const parts = splitCents(BigInt(Math.round(shown)));

  // CTA fixo no celular: aparece quando o botão principal sai da tela.
  const mainCta = useRef<HTMLDivElement>(null);
  const [ctaHidden, setCtaHidden] = useState(false);
  useEffect(() => {
    const el = mainCta.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setCtaHidden(!e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onTalk = (location: string) => {
    track('whatsapp_clicked', { location, objective: q.objective, rule: q.rule.id });
    // Se o envio inicial não foi confirmado, tenta de novo (upsert pelo celular).
    if (contact && !contact.synced) {
      void submitLead({ contact, result, attribution: getAttribution(), honeypot });
    }
  };

  const href = whatsappUrl(resultMessage(result, contact));
  const phone = whatsappDisplay();


  return (
    <section
      id="resultado"
      aria-labelledby="resultado-title"
      className="grain relative isolate min-h-[100svh] overflow-hidden bg-charcoal pb-36 pt-24 md:pt-28 lg:pb-24"
    >
      {/* Mesmo fundo do formulário, fixo enquanto a página rola (o clip-path recorta o fixed à seção) */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 [clip-path:inset(0)]">
        <div className="fixed inset-x-0 top-0 h-[100lvh]">
          <SceneBackground objective={q.objective} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(21_21_21/0.8)_0%,rgb(21_21_21/0.66)_40%,rgb(21_21_21/0.9)_100%)] lg:bg-[linear-gradient(90deg,rgb(21_21_21/0.92)_0%,rgb(21_21_21/0.72)_55%,rgb(21_21_21/0.5)_100%)]" />
        </div>
      </div>

      {/* Só o valor e o convite para conversar: a atenção vai para o número e o botão. */}
      <div className="relative z-[2] mx-auto grid max-w-[90rem] grid-cols-1 gap-x-12 gap-y-10 px-5 md:px-10 lg:min-h-[calc(100svh-12rem)] lg:grid-cols-12 lg:content-center">
        {/* A. O investimento mensal em destaque */}
        <div className="lg:col-span-7 lg:self-end">
          <p className="text-sm font-semibold text-offwhite/80 [text-shadow:0_1px_12px_rgb(21_21_21/0.8)]">{first ? `${first}, este é o seu resultado` : 'Este é o seu resultado'}</p>
          <p className="mt-5 inline-flex rounded-full bg-champagne px-3.5 py-1.5 text-[0.85rem] font-semibold text-charcoal shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)]">
            Investimento mensal de apenas
          </p>
          <p aria-hidden="true" className="tabular mt-3 flex flex-wrap items-baseline gap-x-2 text-champagne [text-shadow:0_2px_28px_rgb(21_21_21/0.75)]">
            <span className="font-display text-[clamp(1.4rem,5vw,2.2rem)] font-semibold">R$</span>
            <span className="display text-[clamp(3.6rem,17vw,9.5rem)] leading-none">
              {parts.int}
              <span className="text-[0.5em]">,{parts.frac}</span>
            </span>
            <span className="text-[clamp(1rem,3vw,1.3rem)] font-semibold text-offwhite/60">/mês</span>
          </p>
          <h1
            id="resultado-title"
            tabIndex={-1}
            className="mt-4 max-w-xl font-display text-[clamp(1.35rem,3.6vw,2.1rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-offwhite outline-none [text-shadow:0_2px_24px_rgb(21_21_21/0.75)]"
          >
            <span className="sr-only">Investimento mensal de apenas {formatCents(main)}, </span>
            para conquistar o seu {obj.noun} de <span className="whitespace-nowrap">R$ {formatReais(q.valueReais)}</span>.
          </h1>
        </div>

        {/* B. Conversa em destaque */}
        <div ref={mainCta} className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-center">
          <div className="relative overflow-hidden rounded-xl bg-graphite p-6 shadow-[inset_0_0_0_1.5px_#d9a66f,0_30px_80px_-30px_rgb(217_166_111/0.7)] sm:p-8">
            <p className="text-sm font-semibold text-champagne">Próximo passo</p>
            <h2 className="mt-2 font-display text-[clamp(1.5rem,4vw,2rem)] font-semibold leading-tight tracking-[-0.025em] text-offwhite">
              Quer saber como fazer esse investimento?
            </h2>
            <p className="mt-3 leading-relaxed text-offwhite/70">
              Fale agora com o especialista pelo WhatsApp. Sua simulação já vai na mensagem.
            </p>
            <ButtonLink
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              icon={MessageCircle}
              fullWidth
              className="mt-6 !min-h-16 !text-[1.05rem]"
              onClick={() => onTalk('result_card')}
            >
              Falar no WhatsApp
            </ButtonLink>
            {phone && (
              <a
                href={`tel:+${SITE.whatsappNumber}`}
                onClick={() => track('whatsapp_clicked', { location: 'result_phone', objective: q.objective })}
                className="mt-3 flex min-h-11 items-center justify-center gap-2 text-sm text-offwhite/65 hover:text-offwhite"
              >
                <Phone aria-hidden="true" className="size-4" />
                Ou ligue: <span className="tabular font-semibold text-offwhite">{phone}</span>
              </a>
            )}
          </div>
        </div>

        {/* C. Refazer e aviso */}
        <div className="lg:col-span-7 lg:self-start">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-offwhite/65 hover:text-offwhite"
          >
            <RotateCcw aria-hidden="true" className="size-4" strokeWidth={2} />
            Refazer a simulação
          </button>
          <p className="mt-3 max-w-xl text-[0.78rem] leading-relaxed text-offwhite/45">{SIMULATION_DISCLAIMER}</p>
        </div>
      </div>

      {/* Conversa sempre à mão no celular */}
      <div
        className={cn(
          'fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 transition-[transform,opacity] duration-500 ease-[var(--ease-expo)] lg:hidden',
          ctaHidden ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[140%] opacity-0',
        )}
        aria-hidden={!ctaHidden}
      >
        <ButtonLink
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          icon={MessageCircle}
          fullWidth
          tabIndex={ctaHidden ? 0 : -1}
          className="shadow-[0_18px_40px_-10px_rgb(0_0_0/0.8)]"
          onClick={() => onTalk('result_sticky')}
        >
          Falar no WhatsApp
        </ButtonLink>
      </div>
    </section>
  );
}
