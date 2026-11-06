import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PLANS,
  SIMULATION_SETTLE_MS,
  type Category,
  type PlanId,
  type VehicleKind,
} from '../../config/simulators';
import { IMAGES, type StockImage as Img } from '../../config/images';
import { simulate, type SimulationOutcome } from '../../lib/calculator';
import { cn } from '../../lib/cn';
import { centsToDecimalString } from '../../lib/money';
import { scrollToId } from '../../lib/scroll';
import { track } from '../../lib/tracking';
import { gsap } from '../../motion/gsap';
import { useMotion } from '../../motion/useMotion';
import type { GoalSelection, SimulationSnapshot } from '../../types';
import { LeadCaptureForm } from '../LeadCaptureForm';
import { StockImage } from '../ui/StockImage';
import { Label, Lines } from '../ui/Type';
import { PlanSelector, PLAN_ORDER } from './PlanSelector';
import { PropertySimulator } from './PropertySimulator';
import { SimulationResult } from './SimulationResult';
import { VehicleSimulator } from './VehicleSimulator';

interface Props {
  goal: GoalSelection | null;
}

/** Fotografia de cada plano na faixa superior do painel (troca com fusão). */
const PLAN_IMAGES: Record<PlanId, Img> = {
  imovel: IMAGES.propertyFacade,
  automovel: IMAGES.headlight,
  moto: IMAGES.motorcycleWide,
};

const initialValues = (): Record<PlanId, number | null> => ({
  imovel: PLANS.imovel.credit.default,
  automovel: PLANS.automovel.credit.default,
  moto: PLANS.moto.credit.default,
});

export function SimulatorSection({ goal }: Props) {
  const root = useRef<HTMLElement>(null);
  const [category, setCategory] = useState<Category>('property');
  const [vehicleKind, setVehicleKind] = useState<VehicleKind>('automovel');
  const [values, setValues] = useState(initialValues);
  const [started, setStarted] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const lastCompleted = useRef('');

  const planId: PlanId = category === 'property' ? 'imovel' : vehicleKind;
  const value = values[planId];

  const { outcome, computedAt } = useMemo(
    () => ({ outcome: simulate(planId, value), computedAt: new Date().toISOString() }),
    [planId, value],
  );

  const snapshot: SimulationSnapshot | null = useMemo(
    () =>
      outcome.status === 'ok'
        ? {
            planId: outcome.plan.id,
            planLabel: outcome.plan.label,
            planNoun: outcome.plan.noun,
            category: outcome.plan.category,
            creditCents: outcome.creditCents,
            installmentCents: outcome.installmentCents,
            termMonths: outcome.termMonths,
            simulatedAt: computedAt,
          }
        : null,
    [outcome, computedAt],
  );

  // Seleção vinda dos capítulos de objetivo
  useEffect(() => {
    if (!goal) return;
    setCategory(goal.category);
    if (goal.vehicleKind) setVehicleKind(goal.vehicleKind);
  }, [goal]);

  const markStarted = useCallback(
    (plan: PlanId) => {
      if (started) return;
      setStarted(true);
      track('simulation_started', { plan, category: PLANS[plan].category });
    },
    [started],
  );

  const fireCompleted = useCallback((o: SimulationOutcome) => {
    if (o.status !== 'ok') return;
    const key = `${o.plan.id}:${o.creditReais}`;
    if (lastCompleted.current === key) return;
    lastCompleted.current = key;
    track('simulation_completed', {
      plan: o.plan.id,
      category: o.plan.category,
      credit_amount: o.creditReais,
      term_months: o.termMonths,
      estimated_installment: Number(centsToDecimalString(o.installmentCents)),
    });
  }, []);

  // Simulação considerada concluída quando o usuário para de ajustar
  useEffect(() => {
    if (!started || outcome.status !== 'ok') return;
    const t = window.setTimeout(() => {
      fireCompleted(outcome);
      setLeadOpen(true);
    }, SIMULATION_SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [outcome, started, fireCompleted]);

  const setValue = (v: number | null) => {
    markStarted(planId);
    setValues((prev) => ({ ...prev, [planId]: v }));
  };

  const selectPlan = (id: PlanId) => {
    if (id === planId) return;
    if (id === 'imovel') setCategory('property');
    else {
      setCategory('vehicle');
      setVehicleKind(id);
    }
    markStarted(id);
  };

  const switchPlan = (target: PlanId) => {
    const carried = values[planId];
    setValues((prev) => ({ ...prev, [target]: carried }));
    selectPlan(target);
  };

  const handleContinue = () => {
    markStarted(planId);
    fireCompleted(outcome);
    setLeadOpen(true);
    requestAnimationFrame(() => scrollToId('cadastro', 'input[name="name"]'));
  };

  // Transição de seção: a folha off-white se abre lateralmente ao entrar.
  useMotion(root, ({ desktop }, el) => {
    if (!desktop) return;
    gsap.fromTo(
      el.querySelector('[data-sim-sheet]'),
      { clipPath: 'inset(0% 4% 0% 4%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 15%', scrub: true },
      },
    );
  });

  const invalid = outcome.status === 'out_of_range' || outcome.status === 'unvalidated_range';
  const planIndex = String(PLAN_ORDER.indexOf(planId) + 1).padStart(2, '0');

  return (
    <section ref={root} id="simulador" aria-labelledby="simulador-title" className="relative bg-charcoal">
      <div data-sim-sheet className="on-light bg-offwhite text-charcoal">
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-y-12 px-5 py-24 md:px-10 md:py-36 lg:grid-cols-12 lg:gap-x-12">
          {/* Contexto */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Label index="02" tone="light">
                Simulação
              </Label>
              <h2
                id="simulador-title"
                data-reveal="lines"
                className="display mt-6 text-[clamp(2.5rem,10vw,3.4rem)] text-charcoal md:text-[clamp(3.2rem,5.6vw,5.4rem)]"
              >
                <Lines
                  lines={['Quanto', 'você quer', <span key="c" className="text-wood">conquistar?</span>]}
                  lineClassName={(i) => (i === 1 ? 'pl-[12%]' : '')}
                />
              </h2>
              <p className="mt-6 max-w-sm leading-relaxed text-charcoal/65">
                Escolha o plano, ajuste o crédito e acompanhe a parcela estimada mudar na hora.
              </p>

              <div className="mt-10">
                <PlanSelector value={planId} onChange={selectPlan} />
              </div>

              <p className="mt-8 hidden max-w-sm text-sm leading-relaxed text-charcoal/60 lg:block">
                <span className="label mr-2 text-wood">Sem cadastro</span>
                Seus dados só são pedidos se você quiser continuar o atendimento.
              </p>
            </div>
          </div>

          {/* Instrumento */}
          <div className="lg:col-span-7">
            <div className="grain relative overflow-hidden rounded-[2px] bg-graphite text-offwhite shadow-[0_50px_100px_-50px_rgb(21_21_21/0.7)]">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-copper via-champagne/50 to-transparent"
              />
              {/* Numeral do plano como elemento gráfico */}
              <span
                key={planId}
                aria-hidden="true"
                className="display numeral-outline pointer-events-none absolute -right-3 top-6 z-[3] animate-tick select-none text-[7rem] leading-none opacity-70 md:top-8 md:text-[12rem]"
              >
                {planIndex}
              </span>

              <div aria-hidden="true" className="relative h-32 overflow-hidden sm:h-40 md:h-52">
                {PLAN_ORDER.map((id) => (
                  <StockImage
                    key={id}
                    image={PLAN_IMAGES[id]}
                    widths={[480, 768, 1080, 1440]}
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className={cn(
                      'absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1100ms] ease-[var(--ease-expo)]',
                      id === planId ? 'scale-100 opacity-100' : 'scale-[1.08] opacity-0',
                    )}
                  />
                ))}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(41_39_37/0.05)_0%,rgb(41_39_37/0.45)_55%,#292725_100%)]" />
              </div>

              <div className="relative z-[2] -mt-10 p-5 pt-0 sm:p-8 sm:pt-0 md:-mt-12 md:p-12 md:pt-0">
                <div className="mb-8 flex items-baseline justify-between gap-4">
                  <p className="font-display text-lg font-semibold tracking-[-0.02em]">{PLANS[planId].label}</p>
                  <p className="label tabular text-offwhite/40">
                    <span className="hidden sm:inline">Prazo de referência · </span>
                    {PLANS[planId].termMonths} meses
                  </p>
                </div>
                <div key={planId} className="animate-tick">
                  {category === 'property' ? (
                    <PropertySimulator value={values.imovel} onChange={setValue} invalid={invalid} />
                  ) : (
                    <VehicleSimulator kind={vehicleKind} value={value} onChange={setValue} invalid={invalid} />
                  )}
                </div>
              </div>

              <div className="relative z-[2] border-t border-offwhite/10 bg-charcoal/55 p-5 sm:p-8 md:p-12">
                <SimulationResult
                  outcome={outcome}
                  leadOpen={leadOpen}
                  onContinue={handleContinue}
                  onSwitchPlan={switchPlan}
                />
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-charcoal/60 lg:hidden">
              <span className="label mr-2 text-wood">Sem cadastro</span>
              Seus dados só são pedidos se você quiser continuar.
            </p>
          </div>

          {leadOpen && (
            <div id="cadastro" className="scroll-mt-20 lg:col-span-12">
              <LeadCaptureForm snapshot={snapshot} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
