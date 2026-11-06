import { MessageCircle } from 'lucide-react';
import { PLANS, SIMULATION_DISCLAIMER, type PlanId } from '../../config/simulators';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useTweenedBigInt } from '../../hooks/useTweenedBigInt';
import type { SimulationOutcome } from '../../lib/calculator';
import { formatCents, formatReais, formatReaisShort, splitCents } from '../../lib/money';
import { track } from '../../lib/tracking';
import { rangeHelpMessage, whatsappUrl } from '../../lib/whatsapp';
import { Button, ButtonLink } from '../ui/Button';

interface Props {
  outcome: SimulationOutcome;
  leadOpen: boolean;
  onContinue: () => void;
  onSwitchPlan: (planId: PlanId) => void;
}

function liveText(outcome: SimulationOutcome) {
  if (outcome.status === 'ok') {
    return `Parcela estimada de ${formatCents(outcome.installmentCents)} por mês, em ${outcome.termMonths} meses, para crédito de ${formatCents(outcome.creditCents)}.`;
  }
  if (outcome.status === 'empty') return 'Informe o valor do crédito.';
  return 'Valor fora da faixa do simulador.';
}

export function SimulationResult({ outcome, leadOpen, onContinue, onSwitchPlan }: Props) {
  const announcement = useDebouncedValue(liveText(outcome), 700);

  return (
    <div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {outcome.status === 'ok' ? (
        <OkResult outcome={outcome} leadOpen={leadOpen} onContinue={onContinue} />
      ) : (
        <NoticeResult outcome={outcome} onSwitchPlan={onSwitchPlan} />
      )}
    </div>
  );
}

function OkResult({
  outcome,
  leadOpen,
  onContinue,
}: {
  outcome: Extract<SimulationOutcome, { status: 'ok' }>;
  leadOpen: boolean;
  onContinue: () => void;
}) {
  const shown = useTweenedBigInt(outcome.installmentCents);
  const { int, frac } = splitCents(shown);

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <p className="label text-champagne">Parcela estimada</p>
        <p className="label tabular text-offwhite/40">{outcome.termMonths} meses</p>
      </div>

      <p className="mt-5 flex items-start font-sans font-bold leading-[0.9] text-offwhite tabular" aria-hidden="true">
        <span className="mr-2 mt-[0.4em] text-lg font-semibold text-offwhite/45 md:text-xl">R$</span>
        <span className="text-[clamp(3.4rem,15vw,6.4rem)] tracking-[-0.05em]">{int}</span>
        <span className="mt-[0.18em] text-[clamp(1.5rem,5.5vw,2.6rem)] tracking-[-0.03em] text-champagne">,{frac}</span>
      </p>
      <p className="mt-3 text-sm text-offwhite/50">
        por mês · crédito de <span className="tabular text-offwhite/80">R$ {formatReais(outcome.creditReais)}</span>
      </p>

      <p className="mt-6 max-w-md border-l border-copper/60 pl-4 text-[0.78rem] leading-relaxed text-offwhite/50">
        {SIMULATION_DISCLAIMER}
      </p>

      <Button onClick={onContinue} fullWidth className="mt-8">
        {leadOpen ? 'Preencher meus dados' : 'Gostei, quero continuar'}
      </Button>
    </>
  );
}

function NoticeResult({
  outcome,
  onSwitchPlan,
}: {
  outcome: Exclude<SimulationOutcome, { status: 'ok' }>;
  onSwitchPlan: (planId: PlanId) => void;
}) {
  const { plan } = outcome;
  const credit = 'creditReais' in outcome ? outcome.creditReais : null;

  let title = 'Informe o valor do crédito';
  let body = 'Digite o valor ou use o controle deslizante para ver a parcela estimada na hora.';
  let suggested: PlanId | undefined;

  if (outcome.status === 'unvalidated_range') {
    title = 'Faixa com atendimento personalizado';
    body = outcome.message;
  } else if (outcome.status === 'out_of_range') {
    suggested = outcome.suggestedPlanId;
    title = outcome.reason === 'below_min' ? 'Valor abaixo da faixa simulada' : 'Valor acima da faixa simulada';
    body = suggested
      ? `Para ${plan.label.toLowerCase()}, o simulador considera créditos de ${formatReaisShort(plan.credit.min)} a ${formatReaisShort(plan.credit.max)}. Esse valor se encaixa em ${PLANS[suggested].label.toLowerCase()}.`
      : `O simulador considera créditos de ${formatReaisShort(plan.credit.min)} a ${formatReaisShort(plan.credit.max)}. Para outros valores, fale com um especialista.`;
  }

  const showWhatsApp = outcome.status !== 'empty' && !suggested && credit !== null;

  return (
    <div role="status">
      <p className="label text-copper">Parcela estimada</p>
      <p className="mt-5 font-display text-[1.6rem] font-semibold leading-tight tracking-[-0.025em] text-offwhite md:text-[2rem]">
        {title}
      </p>
      <p className="mt-4 max-w-md leading-relaxed text-offwhite/60">{body}</p>

      <div className="mt-8 flex flex-col gap-3">
        {suggested && (
          <Button onClick={() => onSwitchPlan(suggested)} fullWidth>
            Simular como {PLANS[suggested].label.toLowerCase()}
          </Button>
        )}
        {showWhatsApp && (
          <ButtonLink
            href={whatsappUrl(rangeHelpMessage(plan.noun, `R$ ${formatReais(credit)}`))}
            target="_blank"
            rel="noopener noreferrer"
            icon={MessageCircle}
            fullWidth
            onClick={() => track('whatsapp_clicked', { location: 'simulator_notice', plan: plan.id })}
          >
            Falar com um especialista
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
