import type { Quote } from './lib/calculator';

/** Contato informado no formulário. */
export interface Contact {
  /** Primeiro nome. */
  name: string;
  /** E.164 sem "+", ex.: 5511912345678 */
  whatsapp: string;
  /** Id devolvido pela API no envio (quando houver). */
  leadId?: string;
  /** true quando a API confirmou o recebimento do lead. */
  synced?: boolean;
}

/** Situação financeira informada pela pessoa. */
export interface Profile {
  incomeReais: number;
  hasSavings: boolean;
  /** Quanto tem guardado (só quando hasSavings). */
  savingsReais: number | null;
}

/** Resultado de uma simulação. */
export interface SimulationResult {
  id: number;
  quote: Quote;
  profile: Profile;
  /** ISO 8601 do momento da simulação. */
  simulatedAt: string;
}
