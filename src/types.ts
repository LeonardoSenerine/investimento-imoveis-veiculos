import type { Category, PlanId, VehicleKind } from './config/simulators';

/** Simulação vinculada ao cadastro. */
export interface SimulationSnapshot {
  planId: PlanId;
  planLabel: string;
  planNoun: string;
  category: Category;
  creditCents: bigint;
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
