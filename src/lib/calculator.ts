import { OBJECTIVES, RULES, VEHICLE_REDUCED_FROM, type Objective, type Rule } from '../config/simulators';
import { divRoundHalfUp, parseDecimal, reaisToCents } from './money';

export interface Quote {
  objective: Objective;
  valueReais: number;
  rule: Rule;
  termMonths: number;
  /** Parcela cheia, em centavos. */
  fullCents: bigint;
  /** Parcela reduzida, em centavos (null quando a regra não tem). */
  reducedCents: bigint | null;
  /** 70, 50 ou null. */
  reducedPercent: number | null;
}

/** Regra aplicada ao objetivo e valor. */
export function ruleFor(objective: Objective, valueReais: number): Rule {
  if (objective === 'imovel') return RULES.imovel;
  return valueReais >= VEHICLE_REDUCED_FROM ? RULES.veiculo : RULES.veiculo_ate_30k;
}

/** Calcula as parcelas pela regra do cliente (centavos exatos, half-up). */
export function quote(objective: Objective, valueReais: number): Quote {
  const rule = ruleFor(objective, valueReais);
  const value = reaisToCents(valueReais);
  const term = BigInt(rule.termMonths);
  const factor = parseDecimal(rule.factor);

  const fullCents = divRoundHalfUp(value * factor.units, factor.scale * term);

  let reducedCents: bigint | null = null;
  let reducedPercent: number | null = null;
  if (rule.reducedShare) {
    const share = parseDecimal(rule.reducedShare);
    const base = divRoundHalfUp(value * share.units, share.scale * term);
    const fee = divRoundHalfUp(value * (factor.units - factor.scale), factor.scale * term);
    reducedCents = base + fee;
    reducedPercent = Math.round((Number(share.units) / Number(share.scale)) * 100);
  }

  return { objective, valueReais, rule, termMonths: rule.termMonths, fullCents, reducedCents, reducedPercent };
}

/** Parcela que aparece em destaque: a reduzida quando existe. */
export const headlineCents = (q: Quote) => q.reducedCents ?? q.fullCents;

export type ValueCheck = { ok: true } | { ok: false; reason: 'empty' | 'below_min' | 'above_max' };

export function checkValue(objective: Objective, valueReais: number | null): ValueCheck {
  const { min, max } = OBJECTIVES[objective].value;
  if (valueReais === null || valueReais <= 0) return { ok: false, reason: 'empty' };
  if (valueReais < min) return { ok: false, reason: 'below_min' };
  if (valueReais > max) return { ok: false, reason: 'above_max' };
  return { ok: true };
}
