import { MessageCircle, RotateCcw, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { IMAGES } from '../config/images';
import { HEAT, PLANS, SIMULATION_DISCLAIMER } from '../config/simulators';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { getAttribution } from '../lib/attribution';
import { cn } from '../lib/cn';
import { evaluate, HEAT_MARKS, type Feasibility, type HeatZone, type SimulationRequest, type Tip } from '../lib/feasibility';
import { formatCents, formatReais } from '../lib/money';
import { tipAction, tipText } from '../lib/tips';
import { track } from '../lib/tracking';
import { heatZoneMessage, whatsappUrl } from '../lib/whatsapp';
import { submitLead } from '../services/leadService';
import type { Contact, SimulationResult } from '../types';
import { ChoiceGroup } from './funnel/fields';
import { ButtonLink } from './ui/Button';
import { StockImage } from './ui/StockImage';

interface Props {
  result: SimulationResult;
  contact: Contact | null;
  honeypot: string;
  onRestart: () => void;
}

export const ZONE_COLOR: Record<HeatZone, string> = { quente: '#e0703f', morno: '#d9a66f', frio: '#8fa5bb' };

const pct = (n: number) => `${Math.round(n * 100)}%`;

const ZONE: Record<HeatZone, { word: string; title: string; talk: string; cta: string; range: string; meaning: string }> = {
  quente: {
    word: 'Quente',
    title: 'Você consegue. Você tem o suficiente.',
    talk: 'Um especialista mostra, pelo WhatsApp, como transformar esse valor na sua conquista.',
    cta: 'Quero saber como',
    range: `${pct(HEAT.hot)} ou mais da parcela`,
    meaning: 'O que você guarda por mês já cobre a parcela. Dá para começar a planejar agora.',
  },
  morno: {
    word: 'Morna',
    title: 'Você está perto.',
    talk: 'Falta pouco. Um especialista ajuda a ajustar prazo ou valor para a conta fechar.',
    cta: 'Quero ajuda para chegar lá',
    range: `de ${pct(HEAT.warm)} a ${Math.round(HEAT.hot * 100) - 1}% da parcela`,
    meaning: 'Você já cobre quase toda a parcela. Um ajuste pequeno no prazo ou no valor fecha a conta.',
  },
  frio: {
    word: 'Fria',
    title: 'Ainda não fecha, mas tem caminho.',
    talk: 'Um especialista monta com você um plano que caiba no seu mês.',
    cta: 'Quero montar um plano possível',
    range: `abaixo de ${pct(HEAT.warm)} da parcela`,
    meaning: 'Hoje o valor ainda não cobre a parcela. Dá para chegar lá com mais prazo, um crédito menor ou guardando mais.',
  },
};

const ZONE_ORDER: HeatZone[] = ['quente', 'morno', 'frio'];

const CONVERSATION_STEPS = [
  'Você manda a mensagem, que já vai pronta com a sua simulação.',
  'Um especialista confere seus números e tira suas dúvidas.',
  'Você vê as opções com calma e decide se quer seguir. Nada é contratado na conversa.',
];

const sameRequest = (a: SimulationRequest, b: SimulationRequest) =>
  a.planId === b.planId && a.monthlyReais === b.monthlyReais && a.creditReais === b.creditReais && a.termMonths === b.termMonths;

/** Termômetro: a cor enche até o ponto da pessoa, o marcador acompanha. */
function Thermometer({ heat }: { heat: number }) {
  const shown = useAnimatedNumber(heat, { duration: 1400 });
  return (
    <div role="img" aria-label={`Termômetro: ${Math.round(heat * 100)} de 100`}>
      <div className="relative">
        <div className="relative h-3.5 overflow-hidden rounded-full bg-offwhite/10">
          <div
            className="absolute inset-0 bg-[linear-gradient(90deg,#8fa5bb_0%,#b9bec0_32%,#d9a66f_58%,#c97a45_76%,#e0703f_100%)]"
            style={{ clipPath: `inset(0 ${(1 - shown) * 100}% 0 0)` }}
          />
          {[HEAT_MARKS.warm, HEAT_MARKS.hot].map((m) => (
            <span key={m} aria-hidden="true" className="absolute inset-y-0 w-px bg-charcoal/70" style={{ left: `${m * 100}%` }} />
          ))}
        </div>
        <span
          aria-hidden="true"
          className="absolute top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-offwhite shadow-[0_0_0_6px_rgb(21_21_21/0.7),0_8px_24px_rgb(0_0_0/0.5)]"
          style={{ left: `${shown * 100}%` }}
        >
          <span className="size-3 rounded-full bg-charcoal" />
        </span>
      </div>
      <div className="relative mt-3 h-5 text-xs font-semibold text-offwhite/50">
        <span className="absolute left-0">Fria</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${((HEAT_MARKS.warm + HEAT_MARKS.hot) / 2) * 100}%` }}>
          Morna
        </span>
        <span className="absolute right-0">Quente</span>
      </div>
    </div>
  );
}

/** Duas barras: o que a pessoa guarda × a parcela de referência. */
function Comparison({ f, color }: { f: Feasibility; color: string }) {
  const plan = PLANS[f.request.planId];
  const monthly = f.request.monthlyReais;
  const installment = Number(f.installmentCents) / 100;
  const scale = Math.max(monthly, installment) * 1.06;
  const wMonthly = useAnimatedNumber(monthly / scale, { duration: 1200 });
  const wInst = useAnimatedNumber(installment / scale, { duration: 1200 });
  const rows = [
    { label: 'O que você guarda por mês', value: `R$ ${formatReais(monthly)}`, w: wMonthly, bar: color, hint: null },
    {
      label: 'Parcela de referência',
      value: formatCents(f.installmentCents),
      w: wInst,
      bar: 'rgb(243 240 234 / 0.35)',
      hint: `Quanto seria preciso reservar por mês para ${plan.feminine ? 'a sua' : 'o seu'} ${plan.noun} de R$ ${formatReais(f.request.creditReais)} em ${f.request.termMonths} meses.`,
    },
  ];
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-offwhite/60">{r.label}</span>
            <span className="tabular font-semibold text-offwhite">{r.value}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-offwhite/[0.08]">
            <div className="h-full rounded-full" style={{ width: `${r.w * 100}%`, background: r.bar }} />
          </div>
          {r.hint && <p className="mt-2 text-[0.8rem] leading-relaxed text-offwhite/55">{r.hint}</p>}
        </div>
      ))}
    </div>
  );
}

/** Frase simples do percentual: "para cada R$ 100 da parcela…". */
function plainRatio(f: Feasibility): string {
  if (f.fits) {
    return f.leftoverCents > 0n
      ? `Seu valor cobre a parcela inteira e ainda sobram ${formatCents(f.leftoverCents)} por mês.`
      : 'Seu valor cobre a parcela inteira.';
  }
  const gap = f.installmentCents - BigInt(f.request.monthlyReais) * 100n;
  return `Para cada R$ 100 da parcela, você já tem R$ ${Math.floor(f.ratio * 100)}. Faltam ${formatCents(gap)} por mês.`;
}

/** As três zonas em linguagem simples, com a da pessoa em destaque. */
function ZoneGuide({ current }: { current: HeatZone }) {
  return (
    <ul className="space-y-2">
      {ZONE_ORDER.map((z) => {
        const on = z === current;
        const c = ZONE_COLOR[z];
        return (
          <li
            key={z}
            className={cn('rounded-md p-4 transition-[background-color,box-shadow] duration-500', on ? 'bg-charcoal/70' : 'bg-transparent')}
            style={{ boxShadow: on ? `inset 0 0 0 1.5px ${c}` : 'inset 0 0 0 1px rgb(243 240 234 / 0.08)' }}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: c }} />
              <span className="font-display font-semibold text-offwhite">Zona {ZONE[z].word.toLowerCase()}</span>
              <span className="text-[0.8rem] text-offwhite/50">{ZONE[z].range}</span>
              {on && (
                <span className="ml-auto rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold text-charcoal" style={{ backgroundColor: c }}>
                  Você está aqui
                </span>
              )}
            </div>
            <p className={cn('mt-1.5 pl-[1.375rem] text-[0.9rem] leading-relaxed', on ? 'text-offwhite/80' : 'text-offwhite/50')}>
              {ZONE[z].meaning}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function ResultPage({ result, contact, honeypot, onRestart }: Props) {
  const original = result.feasibility.request;
  const [scenario, setScenario] = useState<SimulationRequest>(original);
  const f = useMemo(() => evaluate(scenario), [scenario]);
  const changed = !sameRequest(scenario, original);
  const plan = PLANS[f.request.planId];
  const zone = ZONE[f.zone];
  const color = ZONE_COLOR[f.zone];
  const first = contact?.name.trim().split(' ')[0];

  const percent = useAnimatedNumber(Math.round(f.ratio * 100), { duration: 1300 });

  // Faixa do controle "E se…": fixa a partir da simulação original, para não pular.
  const slider = useMemo(() => {
    const inst = Number(result.feasibility.installmentCents) / 100;
    const step = inst < 1000 ? 10 : inst < 10_000 ? 50 : 100;
    const round = (v: number) => Math.max(step, Math.round(v / step) * step);
    return {
      step,
      min: round(Math.max(step, Math.min(original.monthlyReais, inst) * 0.4)),
      max: round(Math.max(original.monthlyReais, inst) * 1.6),
    };
  }, [result, original.monthlyReais]);
  const sliderMax = Math.max(slider.max, scenario.monthlyReais);
  const pct = ((Math.min(scenario.monthlyReais, sliderMax) - slider.min) / (sliderMax - slider.min)) * 100;

  const applyTip = (tip: Tip) => {
    setScenario((s) => {
      if (tip.kind === 'term') return { ...s, termMonths: tip.termMonths };
      if (tip.kind === 'credit') return { ...s, creditReais: tip.creditReais };
      return { ...s, monthlyReais: s.monthlyReais + Number(tip.extraCents / 100n) };
    });
    track('scenario_adjusted', { via: `tip_${tip.kind}` });
  };

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
    track('whatsapp_clicked', { location, heat_zone: f.zone, adjusted: changed });
    // O especialista recebe o cenário final. Se a pessoa ajustou, ou se o envio
    // inicial não foi confirmado, o lead é enviado de novo.
    if (contact && (changed || !contact.synced)) {
      void submitLead({
        stage: 'update',
        contact,
        simulation: { feasibility: f, simulatedAt: new Date().toISOString() },
        attribution: getAttribution(),
        honeypot,
      });
    }
  };

  const href = whatsappUrl(heatZoneMessage(f, contact?.name));
  const zoneStyle = { color, transition: 'color 700ms var(--ease-soft)' } as CSSProperties;

  return (
    <section
      id="resultado"
      aria-labelledby="resultado-title"
      className="grain relative isolate min-h-[100svh] overflow-hidden bg-charcoal pb-36 pt-24 md:pt-28 lg:pb-24"
    >
      {/* Mesmo fundo do hero, fixo enquanto a página rola (o clip-path recorta o fixed à seção) */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 [clip-path:inset(0)]">
        <div className="fixed inset-0">
          <StockImage
            image={IMAGES.hero}
            widths={[640, 960, 1280, 1600, 1920, 2560, 3200]}
            sizes="100vw"
            quality={82}
            className="h-full w-full object-cover"
            style={{ filter: 'contrast(1.06) saturate(1.04)' }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(21_21_21/0.8)_0%,rgb(21_21_21/0.66)_40%,rgb(21_21_21/0.9)_100%)] lg:bg-[linear-gradient(90deg,rgb(21_21_21/0.92)_0%,rgb(21_21_21/0.72)_55%,rgb(21_21_21/0.5)_100%)]" />
        </div>
      </div>

      {/* Calor ambiente: um brilho na cor da zona que respira devagar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[20vw] -top-[20vw] -z-10 size-[80vw] rounded-full opacity-30 blur-[120px] motion-safe:animate-breathe lg:size-[55vw]"
        style={{ backgroundColor: color, transition: 'background-color 900ms var(--ease-soft)' }}
      />

      <div className="relative z-[2] mx-auto grid max-w-[90rem] grid-cols-1 gap-x-12 gap-y-10 px-5 md:px-10 lg:grid-cols-12">
        {/* A. Veredito */}
        <div className="lg:col-span-7">
          <p className="text-sm font-semibold text-offwhite/60">
            {first ? `${first}, sua zona de calor é` : 'Sua zona de calor é'}
          </p>
          <p aria-hidden="true" className="display mt-1 text-[clamp(4.5rem,22vw,11rem)]" style={zoneStyle}>
            <span key={f.zone} className="inline-block animate-tick">
              {zone.word}
            </span>
          </p>
          <h1
            id="resultado-title"
            tabIndex={-1}
            className="mt-3 font-display text-[clamp(1.6rem,4.6vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-offwhite outline-none"
          >
            <span className="sr-only">Zona {zone.word.toLowerCase()}. </span>
            {zone.title}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-offwhite/70 md:text-lg">
            Você guarda{' '}
            <span className="tabular font-display text-[1.6em] font-semibold leading-none" style={zoneStyle}>
              {Math.round(percent)}%
            </span>{' '}
            da parcela de referência.
          </p>
        </div>

        {/* B. Conversa em destaque */}
        <div ref={mainCta} className="lg:col-span-5 lg:col-start-8 lg:row-span-4 lg:row-start-1">
          <div className="lg:sticky lg:top-28">
            <div
              className="relative overflow-hidden rounded-xl bg-graphite p-6 sm:p-8"
              style={{ boxShadow: `inset 0 0 0 1.5px ${color}, 0 30px 80px -30px ${color}` }}
            >
              <p className="text-sm font-semibold" style={zoneStyle}>
                Próximo passo
              </p>
              <h2 className="mt-2 font-display text-[clamp(1.5rem,4vw,2rem)] font-semibold leading-tight tracking-[-0.025em] text-offwhite">
                {first ? `${first}, vamos conversar?` : 'Vamos conversar?'}
              </h2>
              <p className="mt-3 leading-relaxed text-offwhite/70">{zone.talk}</p>
              <ButtonLink
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                icon={MessageCircle}
                fullWidth
                className="mt-6 !min-h-16 !text-[1.05rem]"
                onClick={() => onTalk('result_card')}
              >
                {zone.cta}
              </ButtonLink>
              <p className="mt-3 text-center text-[0.8rem] text-offwhite/50">
                Pelo WhatsApp. Sua simulação já vai na mensagem.
              </p>

              <div className="mt-6 border-t border-offwhite/10 pt-5">
                <p className="text-sm font-semibold text-offwhite/85">Como é a conversa</p>
                <ol className="mt-3 space-y-3">
                  {CONVERSATION_STEPS.map((step, i) => (
                    <li key={step} className="flex gap-3 text-[0.9rem] leading-relaxed text-offwhite/70">
                      <span
                        aria-hidden="true"
                        className="tabular grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold text-charcoal"
                        style={{ backgroundColor: color, transition: 'background-color 700ms var(--ease-soft)' }}
                      >
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* C. Entenda seu resultado, em linguagem simples */}
        <div className="lg:col-span-7">
          <div className="rounded-xl bg-charcoal/65 p-5 shadow-[inset_0_0_0_1px_rgb(243_240_234/0.1)] backdrop-blur-md sm:p-7">
            <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-offwhite">O que isso significa</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-offwhite/70">
              A zona de calor compara o que você consegue guardar por mês com a parcela de referência da sua simulação.
              Quanto mais perto de cobrir a parcela, mais quente.
            </p>

            <div className="mt-6">
              <Thermometer heat={f.heat} />
            </div>
            <p className="mt-3 text-[0.95rem] font-semibold leading-relaxed text-offwhite">{plainRatio(f)}</p>

            <div className="mt-6">
              <Comparison f={f} color={color} />
            </div>

            <div className="mt-7 border-t border-offwhite/10 pt-6">
              <p className="text-sm font-semibold text-offwhite/85">As três zonas</p>
              <div className="mt-3">
                <ZoneGuide current={f.zone} />
              </div>
            </div>
          </div>
        </div>

        {/* D. E se… (ajustes ao vivo) */}
        <div className="lg:col-span-7">
          <div className="rounded-xl bg-charcoal/65 p-5 shadow-[inset_0_0_0_1px_rgb(243_240_234/0.1)] backdrop-blur-md sm:p-7">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-offwhite">E se…</h2>
              {changed && (
                <button
                  type="button"
                  onClick={() => setScenario(original)}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-offwhite/60 hover:text-offwhite"
                >
                  <Undo2 aria-hidden="true" className="size-4" /> Voltar ao que simulei
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-offwhite/55">Mude os valores e veja a temperatura mudar na hora.</p>

            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="e-se-mensal" className="text-sm font-semibold text-offwhite/85">
                  Quanto guardar por mês
                </label>
                <span className="tabular font-display text-lg font-semibold text-offwhite">
                  R$ {formatReais(scenario.monthlyReais)}
                </span>
              </div>
              <input
                id="e-se-mensal"
                type="range"
                min={slider.min}
                max={sliderMax}
                step={slider.step}
                value={Math.min(scenario.monthlyReais, sliderMax)}
                aria-valuetext={`R$ ${formatReais(scenario.monthlyReais)} por mês`}
                onChange={(e) => setScenario((s) => ({ ...s, monthlyReais: Number(e.target.value) }))}
                onPointerUp={() => track('scenario_adjusted', { via: 'monthly_slider' })}
                className="range mt-2"
                style={{ '--pct': `${pct}%` } as CSSProperties}
              />
            </div>

            <div className="mt-5">
              <ChoiceGroup
                legend="Em quantos meses"
                value={scenario.termMonths}
                onChange={(t) => {
                  setScenario((s) => ({ ...s, termMonths: t }));
                  track('scenario_adjusted', { via: 'term' });
                }}
                options={plan.termOptions.map((t) => ({ value: t, label: String(t) }))}
              />
            </div>

            <p className="mt-5 text-sm text-offwhite/55">
              Crédito para {plan.label.toLowerCase()}:{' '}
              <span className="tabular font-semibold text-offwhite">R$ {formatReais(scenario.creditReais)}</span>
            </p>

            {f.tips.length > 0 && (
              <div className="mt-6 border-t border-offwhite/10 pt-5">
                <p className="text-sm font-semibold text-offwhite/85">Como chegar lá</p>
                <ul className="mt-3 space-y-3">
                  {f.tips.map((tip) => (
                    <li key={tip.kind} className="flex flex-col gap-2 rounded-md bg-charcoal/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[0.92rem] leading-relaxed text-offwhite/75">{tipText(tip)}</span>
                      <button
                        type="button"
                        onClick={() => applyTip(tip)}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md px-4 text-sm font-semibold text-charcoal transition-[background-color,transform] active:translate-y-px"
                        style={{ backgroundColor: color }}
                      >
                        {tipAction(tip)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* E. Refazer e aviso */}
        <div className="lg:col-span-7">
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
          {zone.cta}
        </ButtonLink>
      </div>
    </section>
  );
}
