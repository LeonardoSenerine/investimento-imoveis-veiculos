import type { Feasibility } from './lib/feasibility';

/** Contato informado no segundo passo, junto com a simulação. */
export interface Contact {
  name: string;
  /** E.164 sem "+", ex.: 5511912345678 */
  whatsapp: string;
  /** Id devolvido pela API no envio (quando houver). */
  leadId?: string;
  /** true quando a API confirmou o recebimento do lead. */
  synced?: boolean;
}

/** Resultado de uma simulação, com identificador para reanimar a zona de calor. */
export interface SimulationResult {
  id: number;
  feasibility: Feasibility;
  /** ISO 8601 do momento da simulação. */
  simulatedAt: string;
}
