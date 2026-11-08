import { HEAT, PLANS, type PlanId } from '../config/simulators';
import { estimateCreditFromMonthly, estimateInstallmentCents, resolveTerm } from './calculator';
import { reaisToCents } from './money';

export type HeatZone = 'quente' | 'morno' | 'frio';

export interface SimulationRequest {
  planId: PlanId;
  /** Quanto a pessoa consegue guardar por mês (reais inteiros). */
  monthlyReais: number;
  /** De quanto crédito ela precisa (reais inteiros). */
  creditReais: number;
  termMonths: number;
}

export type Tip =
  | { kind: 'term'; termMonths: number; installmentCents: bigint }
  | { kind: 'credit'; creditReais: number }
  | { kind: 'monthly'; extraCents: bigint };

export interface Feasibility {
  request: SimulationRequest;
  /** Parcela de referência do crédito pedido no prazo escolhido. */
  installmentCents: bigint;
  fits: boolean;
  zone: HeatZone;
  /** Valor mensal ÷ parcela de referência. */
  ratio: number;
  /** Posição no termômetro, de 0 (frio) a 1 (quente). */
  heat: number;
  /** Quanto sobra por mês quando cabe. */
  leftoverCents: bigint;
  /** Caminhos para chegar lá quando ainda não cabe, do mais simples ao mais exigente. */
  tips: Tip[];
}

/** Escala do termômetro: razão 1,4 ou mais = ponta quente. */
const HEAT_SCALE = 1.4;
export const HEAT_MARKS = { warm: HEAT.warm / HEAT_SCALE, hot: HEAT.hot / HEAT_SCALE };

export function evaluate(request: SimulationRequest): Feasibility {
  const plan = PLANS[request.planId];
  const term = resolveTerm(plan, request.termMonths);
  const installmentCents = estimateInstallmentCents(plan, request.creditReais, term);
  const monthlyCents = reaisToCents(request.monthlyReais);

  const ratio = Number(monthlyCents) / Number(installmentCents);
  const fits = monthlyCents >= installmentCents;
  const zone: HeatZone = fits ? 'quente' : ratio >= HEAT.warm ? 'morno' : 'frio';
  const heat = Math.max(0, Math.min(1, ratio / HEAT_SCALE));

  const tips: Tip[] = [];
  if (!fits) {
    // 1. Um prazo maior, dentre as opções, em que a parcela caiba.
    const longer = plan.termOptions
      .filter((t) => t > term)
      .map((t) => ({ t, cents: estimateInstallmentCents(plan, request.creditReais, t) }))
      .find(({ cents }) => cents <= monthlyCents);
    if (longer) tips.push({ kind: 'term', termMonths: longer.t, installmentCents: longer.cents });

    // 2. O crédito que cabe hoje, no mesmo prazo (se ainda estiver na faixa do plano).
    const credit = estimateCreditFromMonthly(plan, request.monthlyReais, term);
    if (credit >= plan.credit.min) tips.push({ kind: 'credit', creditReais: credit });

    // 3. Quanto guardar a mais por mês (arredondado para cima, em reais).
    const missing = installmentCents - monthlyCents;
    const extraCents = ((missing + 99n) / 100n) * 100n;
    tips.push({ kind: 'monthly', extraCents });
  }

  return {
    request: { ...request, termMonths: term },
    installmentCents,
    fits,
    zone,
    ratio,
    heat,
    leftoverCents: fits ? monthlyCents - installmentCents : 0n,
    tips,
  };
}
