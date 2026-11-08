import { useState, type FormEvent } from 'react';
import { PLAN_ORDER, PLANS, type PlanId } from '../../config/simulators';
import { checkCredit } from '../../lib/calculator';
import { formatReais, formatReaisShort } from '../../lib/money';
import { track } from '../../lib/tracking';
import { specialistMessage, whatsappUrl } from '../../lib/whatsapp';
import { Button } from '../ui/Button';
import { ChoiceGroup, MoneyField } from './fields';

export interface ValuesDraft {
  planId: PlanId;
  monthly: number | null;
  credit: number | null;
  term: number;
}

export const initialValues = (): ValuesDraft => ({
  planId: 'imovel',
  monthly: null,
  credit: null,
  term: PLANS.imovel.termMonths,
});

interface Props {
  values: ValuesDraft;
  onChange: (patch: Partial<ValuesDraft>) => void;
  onDone: () => void;
}

/** Erro do crédito em linguagem direta (ou null quando está tudo certo). */
export function creditError(values: ValuesDraft): string | null {
  const plan = PLANS[values.planId];
  const check = checkCredit(values.planId, values.credit);
  if (check.ok) return null;
  if (check.reason === 'empty') return 'Informe de quanto crédito você precisa.';
  if (check.reason === 'unvalidated') return 'Entre R$ 30 mil e R$ 35 mil, um especialista monta a simulação com você.';
  const other = check.suggestedPlanId ? ` Para esse valor, escolha ${PLANS[check.suggestedPlanId].label}.` : '';
  return `Para ${plan.label.toLowerCase()}, a simulação vai de ${formatReaisShort(plan.credit.min)} a ${formatReaisShort(plan.credit.max)}.${other}`;
}

/** Passo 1: os valores. O botão só libera com tudo preenchido e válido. */
export function ValuesStep({ values, onChange, onDone }: Props) {
  const [touched, setTouched] = useState({ monthly: false, credit: false });
  const plan = PLANS[values.planId];
  const change = onChange;

  const monthlyMissing = values.monthly === null || values.monthly <= 0;
  const credit = creditError(values);
  const ready = !monthlyMissing && !credit;
  const missing =
    monthlyMissing && values.credit === null
      ? 'Falta informar quanto você guarda por mês e o crédito.'
      : monthlyMissing
        ? 'Falta informar quanto você consegue guardar por mês.'
        : values.credit === null
          ? 'Falta informar de quanto crédito você precisa.'
          : 'Ajuste o crédito para continuar.';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (ready) onDone();
  }

  const check = checkCredit(values.planId, values.credit);
  const gap = !check.ok && check.reason === 'unvalidated';

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col">
      <h2 className="font-display text-[1.45rem] font-semibold leading-tight tracking-[-0.02em]">Comece pelos valores</h2>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-offwhite/60">Leva menos de um minuto.</p>

      <div className="mt-6 space-y-5">
        <ChoiceGroup
          legend="O que você quer conquistar"
          columns={3}
          value={values.planId}
          onChange={(id) => change({ planId: id, term: PLANS[id].termMonths })}
          options={PLAN_ORDER.map((id) => ({ value: id, label: PLANS[id].label }))}
        />
        <MoneyField
          name="monthly"
          label="Quanto você consegue guardar por mês"
          placeholder="2.000"
          suffix="por mês"
          value={values.monthly}
          onChange={(v) => change({ monthly: v })}
          onBlur={() => setTouched((t) => ({ ...t, monthly: true }))}
          error={touched.monthly && monthlyMissing ? 'Informe quanto você consegue guardar por mês.' : null}
        />
        <MoneyField
          name="credit"
          label="De quanto crédito você precisa"
          placeholder={formatReais(plan.credit.min * (plan.id === 'imovel' ? 3 : 2))}
          value={values.credit}
          onChange={(v) => change({ credit: v })}
          onBlur={() => setTouched((t) => ({ ...t, credit: true }))}
          hint={`${plan.label}: de ${formatReaisShort(plan.credit.min)} a ${formatReaisShort(plan.credit.max)}`}
          // Fora da faixa avisa na hora; campo vazio só depois de sair dele.
          error={values.credit !== null || touched.credit ? credit : null}
        />
        {gap && (
          <a
            href={whatsappUrl(specialistMessage(plan.noun, `R$ ${formatReais(values.credit ?? 0)}`, plan.feminine))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_clicked', { location: 'credit_gap' })}
            className="link-draw inline-flex min-h-11 items-center text-sm font-semibold text-champagne"
          >
            Falar com um especialista
          </a>
        )}
        <ChoiceGroup
          legend="Em quantos meses"
          value={values.term}
          onChange={(t) => change({ term: t })}
          options={plan.termOptions.map((t) => ({ value: t, label: String(t) }))}
        />
      </div>

      <Button type="submit" className="mt-7" fullWidth disabled={!ready} aria-describedby="valores-pendente">
        Continuar
      </Button>
      <p id="valores-pendente" aria-live="polite" className="mt-3 min-h-5 text-center text-[0.8rem] text-offwhite/50">
        {ready ? '' : missing}
      </p>
    </form>
  );
}
