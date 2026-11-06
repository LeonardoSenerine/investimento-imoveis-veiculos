import { MessageCircle } from 'lucide-react';
import { MODALITY_NOTE, PLANS, SIMULATION_DISCLAIMER, type PlanId } from '../../config/simulators';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useTweenedBigInt } from '../../hooks/useTweenedBigInt';
import type { MonthlyOutcome } from '../../lib/calculator';
import { formatCents, formatReais } from '../../lib/money';
import { track } from '../../lib/tracking';
import { rangeHelpMessage, whatsappUrl } from '../../lib/whatsapp';
import { Button, ButtonLink } from '../ui/Button';

interface Props {
  outcome: MonthlyOutcome;
  leadOpen: boolean;
  onContinue: () => void;
  onSwitchPlan: (planId: PlanId) => void;
}

type Ok = Extract<MonthlyOutcome, { status: 'ok' }>;

function liveText(outcome: MonthlyOutcome) {
  if (outcome.status === 'ok') {
    return `Com R$ ${formatReais(outcome.monthlyReais ?? 0)} por mês, crédito estimado de ${formatCents(outcome.creditCents)} em ${outcome.termMonths} meses.`;
  }
  if (outcome.status === 'empty') return 'Informe quanto você pode investir por mês.';
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
        <OkResult outcome={outcome as Ok} leadOpen={leadOpen} onContinue={onContinue} />
      ) : (
        <NoticeResult outcome={outcome} onSwitchPlan={onSwitchPlan} />
      )}
    </div>
  );
}

function OkResult({ outcome, leadOpen, onContinue }: { outcome: Ok; leadOpen: boolean; onContinue: () => void }) {
  // O número animado é o crédito; o valor final exibido é sempre o exato.
  const shown = useTweenedBigInt(outcome.creditCents, 520);
  const shownReais = Number(shown / 100n);

  return (
    <>
      <p className="label text-champagne">Crédito que você pode planejar</p>

      <p className="figure mt-5 flex items-start font-sans font-bold leading-[0.9] text-offwhite" aria-hidden="true">
        <span className="mr-2 mt-[0.4em] text-lg font-semibold text-offwhite/45 md:text-xl">R$</span>
        <span className="text-[clamp(3rem,13.5vw,6rem)] tracking-[-0.05em]">{formatReais(shownReais)}</span>
      </p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-offwhite/55">
        Estimativa em {outcome.termMonths} meses, com parcela de referência de{' '}
        <span className="tabular text-offwhite/85">{formatCents(outcome.installmentCents)}</span>, dentro dos{' '}
        <span className="tabular text-offwhite/85">R$ {formatReais(outcome.monthlyReais ?? 0)}</span> que você informou.
      </p>

      <div className="mt-6 max-w-md space-y-2 border-l border-copper/60 pl-4 text-[0.78rem] leading-relaxed text-offwhite/55">
        <p className="text-offwhite/75">{MODALITY_NOTE}</p>
        <p>{SIMULATION_DISCLAIMER}</p>
      </div>

      <Button onClick={onContinue} fullWidth className="mt-8">
        {leadOpen ? 'Continuar meu planejamento' : 'Gostei, quero continuar'}
      </Button>
    </>
  );
}

function NoticeResult({
  outcome,
  onSwitchPlan,
}: {
  outcome: Exclude<MonthlyOutcome, { status: 'ok' }>;
  onSwitchPlan: (planId: PlanId) => void;
}) {
  const { plan, monthlyRange, monthlyReais } = outcome;
  const range = `R$ ${formatReais(monthlyRange.min)} a R$ ${formatReais(monthlyRange.max)} por mês`;

  let title = 'Quanto cabe no seu mês?';
  let body = 'Digite o valor ou use o controle deslizante para ver o crédito que dá para planejar.';
  let suggested: PlanId | undefined;

  if (outcome.status === 'unvalidated_range') {
    title = 'Esse valor pede uma conversa';
    body =
      'Para esse valor mensal, o crédito fica numa faixa que o simulador ainda não calcula. Um especialista monta essa estimativa com você.';
  } else if (outcome.status === 'out_of_range') {
    suggested = outcome.suggestedPlanId;
    title = outcome.reason === 'below_min' ? 'Valor abaixo da faixa simulada' : 'Valor acima da faixa simulada';
    body = suggested
      ? `Para ${plan.noun}, o simulador considera de ${range}. Com esse valor, dá para planejar ${PLANS[suggested].label.toLowerCase() === 'motocicleta' ? 'uma motocicleta' : 'um automóvel'}.`
      : `Para ${plan.noun}, o simulador considera de ${range}. Para outros valores, fale com um especialista.`;
  }

  const showWhatsApp = outcome.status !== 'empty' && !suggested && monthlyReais !== null;

  return (
    <div role="status">
      <p className="label text-champagne">Crédito que você pode planejar</p>
      <p className="mt-5 font-display text-[1.6rem] font-semibold leading-tight tracking-[-0.025em] text-offwhite md:text-[2rem]">
        {title}
      </p>
      <p className="mt-4 max-w-md leading-relaxed text-offwhite/60">{body}</p>

      <div className="mt-8 flex flex-col gap-3">
        {suggested && (
          <Button onClick={() => onSwitchPlan(suggested)} fullWidth>
            Simular para {PLANS[suggested].label.toLowerCase()}
          </Button>
        )}
        {showWhatsApp && (
          <ButtonLink
            href={whatsappUrl(rangeHelpMessage(plan.noun, `R$ ${formatReais(monthlyReais)}`))}
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
