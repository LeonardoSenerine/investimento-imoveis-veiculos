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

/** Parcela = (crédito × fator) ÷ prazo, em centavos, arredondamento half-up. */
export function estimateInstallmentCents(plan: PlanConfig, creditReais: number): bigint {
  const credit = reaisToCents(creditReais);
  const { units, scale } = parseDecimal(plan.factor);
  return divRoundHalfUp(credit * units, scale * BigInt(plan.termMonths));
}

const inUnvalidatedRange = (value: number) =>
  value > UNVALIDATED_VEHICLE_RANGE.from && value < UNVALIDATED_VEHICLE_RANGE.to;

export function simulate(planId: PlanId, creditReais: number | null): SimulationOutcome {
  const plan = PLANS[planId];

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
    installmentCents: estimateInstallmentCents(plan, creditReais),
    termMonths: plan.termMonths,
  };
}
