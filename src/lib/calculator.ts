import { PLANS, UNVALIDATED_VEHICLE_RANGE, type PlanConfig, type PlanId } from '../config/simulators';
import { divRoundHalfUp, parseDecimal, reaisToCents } from './money';

/** Prazo válido para o plano: se não for uma das opções, usa o padrão. */
export const resolveTerm = (plan: PlanConfig, term?: number) =>
  term !== undefined && plan.termOptions.includes(term) ? term : plan.termMonths;

/** Parcela de referência = (crédito × fator) ÷ prazo, em centavos, arredondamento half-up. */
export function estimateInstallmentCents(plan: PlanConfig, creditReais: number, term?: number): bigint {
  const credit = reaisToCents(creditReais);
  const { units, scale } = parseDecimal(plan.factor);
  return divRoundHalfUp(credit * units, scale * BigInt(resolveTerm(plan, term)));
}

const floorTo = (value: number, step: number) => Math.floor(value / step) * step;

/**
 * Crédito que cabe num valor mensal, pela fórmula inversa:
 *   crédito = (mensal × prazo) ÷ fator
 * Arredondado PARA BAIXO até o passo do plano (estimativa conservadora).
 */
export function estimateCreditFromMonthly(plan: PlanConfig, monthlyReais: number, term?: number): number {
  const monthlyCents = reaisToCents(monthlyReais);
  const { units, scale } = parseDecimal(plan.factor);
  const creditCents = (monthlyCents * BigInt(resolveTerm(plan, term)) * scale) / units; // divisão inteira = piso
  return floorTo(Number(creditCents / 100n), plan.credit.step);
}

export type CreditCheck =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'below_min' | 'above_max' | 'unvalidated'; suggestedPlanId?: PlanId };

/** Valida se o crédito pedido está na faixa que o simulador calcula para o plano. */
export function checkCredit(planId: PlanId, creditReais: number | null): CreditCheck {
  const plan = PLANS[planId];
  if (creditReais === null || creditReais <= 0) return { ok: false, reason: 'empty' };
  if (
    plan.category === 'vehicle' &&
    creditReais > UNVALIDATED_VEHICLE_RANGE.from &&
    creditReais < UNVALIDATED_VEHICLE_RANGE.to
  ) {
    return { ok: false, reason: 'unvalidated' };
  }
  if (creditReais < plan.credit.min || creditReais > plan.credit.max) {
    const suggested = (Object.values(PLANS) as PlanConfig[]).find(
      (p) => p.category === plan.category && p.id !== plan.id && creditReais >= p.credit.min && creditReais <= p.credit.max,
    );
    return {
      ok: false,
      reason: creditReais < plan.credit.min ? 'below_min' : 'above_max',
      suggestedPlanId: suggested?.id,
    };
  }
  return { ok: true };
}
