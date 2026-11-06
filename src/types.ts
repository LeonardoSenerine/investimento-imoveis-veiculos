import type { Category, PlanId, VehicleKind } from './config/simulators';

/** Simulação vinculada ao cadastro. */
export interface SimulationSnapshot {
  planId: PlanId;
  planLabel: string;
  planNoun: string;
  category: Category;
  /** Quanto a pessoa disse que pode investir por mês. */
  monthlyBudgetCents: bigint;
  /** Crédito estimado (arredondado para baixo) que cabe nesse valor. */
  creditCents: bigint;
  /** Parcela de referência do crédito estimado (≤ valor mensal informado). */
  installmentCents: bigint;
  termMonths: number;
  /** ISO 8601 do momento em que o resultado foi calculado. */
  simulatedAt: string;
}

export interface GoalSelection {
  category: Category;
  vehicleKind?: VehicleKind;
  /** Muda a cada seleção para reaplicar mesmo se a categoria for a mesma. */
  nonce: number;
}
