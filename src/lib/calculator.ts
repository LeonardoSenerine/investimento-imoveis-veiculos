import {
  PLANS,
  UNVALIDATED_VEHICLE_RANGE,
  type PlanConfig,
  type PlanId,
} from '../config/simulators';
import { divRoundHalfUp, parseDecimal, reaisToCents } from './money';

export type SimulationOutcome =
  | {
      status: 'ok';
      plan: PlanConfig;
      creditReais: number;
      creditCents: bigint;
      installmentCents: bigint;
      termMonths: number;
    }
  | { status: 'empty'; plan: PlanConfig }
  | {
      status: 'unvalidated_range';
      plan: PlanConfig;
      creditReais: number;
      message: string;
    }
  | {
      status: 'out_of_range';
      plan: PlanConfig;
      creditReais: number;
      reason: 'below_min' | 'above_max';
      /** Plano que atende esse valor, quando existir. */
      suggestedPlanId?: PlanId;
    };

/** Prazo válido para o plano: se não for uma das opções, usa o padrão. */
export const resolveTerm = (plan: PlanConfig, term?: number) =>
  term !== undefined && plan.termOptions.includes(term) ? term : plan.termMonths;

/** Parcela = (crédito × fator) ÷ prazo, em centavos, arredondamento half-up. */
export function estimateInstallmentCents(plan: PlanConfig, creditReais: number, term?: number): bigint {
  const credit = reaisToCents(creditReais);
  const { units, scale } = parseDecimal(plan.factor);
  return divRoundHalfUp(credit * units, scale * BigInt(resolveTerm(plan, term)));
}

const inUnvalidatedRange = (value: number) =>
  value > UNVALIDATED_VEHICLE_RANGE.from && value < UNVALIDATED_VEHICLE_RANGE.to;

export function simulate(planId: PlanId, creditReais: number | null, term?: number): SimulationOutcome {
  const plan = PLANS[planId];
  const months = resolveTerm(plan, term);

  if (creditReais === null || creditReais <= 0) return { status: 'empty', plan };

  if (plan.category === 'vehicle' && inUnvalidatedRange(creditReais)) {
    return {
      status: 'unvalidated_range',
      plan,
      creditReais,
      message: UNVALIDATED_VEHICLE_RANGE.message,
    };
  }

  const { min, max } = plan.credit;
  if (creditReais < min || creditReais > max) {
    const reason = creditReais < min ? 'below_min' : 'above_max';
    const suggested = (Object.values(PLANS) as PlanConfig[]).find(
      (p) =>
        p.category === plan.category &&
        p.id !== plan.id &&
        creditReais >= p.credit.min &&
        creditReais <= p.credit.max,
    );
    return { status: 'out_of_range', plan, creditReais, reason, suggestedPlanId: suggested?.id };
  }

  return {
    status: 'ok',
    plan,
    creditReais,
    creditCents: reaisToCents(creditReais),
    installmentCents: estimateInstallmentCents(plan, creditReais, months),
    termMonths: months,
  };
}

/* ------------------------------------------------------------------------ */
/* Fluxo principal: a pessoa informa quanto pode investir por mês.            */
/* ------------------------------------------------------------------------ */

const ceilTo = (value: number, step: number) => Math.ceil(value / step) * step;
const floorTo = (value: number, step: number) => Math.floor(value / step) * step;

/**
 * Crédito que cabe num valor mensal, pela fórmula inversa:
 *   crédito = (mensal × prazo) ÷ fator
 * Arredondado PARA BAIXO até o passo da faixa de crédito (estimativa conservadora:
 * a parcela de referência desse crédito nunca passa do valor informado).
 */
export function estimateCreditFromMonthly(plan: PlanConfig, monthlyReais: number, term?: number): number {
  const monthlyCents = reaisToCents(monthlyReais);
  const { units, scale } = parseDecimal(plan.factor);
  const creditCents = (monthlyCents * BigInt(resolveTerm(plan, term)) * scale) / units; // divisão inteira = piso
  return floorTo(Number(creditCents / 100n), plan.credit.step);
}

/** Faixa de valores mensais coerente com a faixa de crédito do plano e o prazo escolhido. */
export function monthlyRange(plan: PlanConfig, term?: number): { min: number; max: number } {
  const cents = (credit: number) => Number(estimateInstallmentCents(plan, credit, term)) / 100;
  return {
    min: ceilTo(cents(plan.credit.min), plan.monthly.step),
    max: floorTo(cents(plan.credit.max), plan.monthly.step),
  };
}

export type MonthlyOutcome = SimulationOutcome & {
  monthlyReais: number | null;
  monthlyRange: { min: number; max: number };
};

export function simulateFromMonthly(planId: PlanId, monthlyReais: number | null, term?: number): MonthlyOutcome {
  const plan = PLANS[planId];
  const months = resolveTerm(plan, term);
  const range = monthlyRange(plan, months);
  if (monthlyReais === null || monthlyReais <= 0) {
    return { status: 'empty', plan, monthlyReais, monthlyRange: range };
  }
  const credit = estimateCreditFromMonthly(plan, monthlyReais, months);
  // Crédito zero (valor mensal ínfimo) é tratado como abaixo da faixa.
  const base = simulate(planId, Math.max(credit, 1), months);
  return { ...base, monthlyReais, monthlyRange: range };
}
