/**
 * CONFIGURAÇÃO DOS SIMULADORES
 * ---------------------------------------------------------------------------
 * ATENÇÃO: os fatores e prazos abaixo são PARÂMETROS PRELIMINARES fornecidos
 * pelo cliente e ainda precisam de validação comercial e documental.
 *
 * Fórmula aplicada a todos os planos:
 *   parcela estimada = (crédito × fator) ÷ prazo
 *
 * - `factor` é string para preservar a precisão decimal (nunca usar float).
 * - As faixas de crédito (min/max/step) são escolhas de interface e também
 *   devem ser confirmadas com as regras dos planos disponíveis.
 * - Nenhum número de regra deve ser fixado fora deste arquivo.
 */

export type PlanId = 'imovel' | 'automovel' | 'moto';
export type Category = 'property' | 'vehicle';
export type VehicleKind = Extract<PlanId, 'automovel' | 'moto'>;

export interface CreditRange {
  /** Valores em reais inteiros. */
  min: number;
  max: number;
  step: number;
  default: number;
  quickPicks: number[];
}

export interface PlanConfig {
  id: PlanId;
  category: Category;
  label: string;
  /** Rótulo usado em frases: "consórcio de {noun}". */
  noun: string;
  factor: string;
  termMonths: number;
  credit: CreditRange;
  /** Resumo da faixa exibido na interface. */
  rangeSummary: string;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  imovel: {
    id: 'imovel',
    category: 'property',
    label: 'Imóvel',
    noun: 'imóvel',
    factor: '1.242',
    termMonths: 220,
    credit: {
      min: 100_000,
      max: 2_000_000,
      step: 5_000,
      default: 500_000,
      quickPicks: [300_000, 500_000, 800_000, 1_200_000],
    },
    rangeSummary: 'Prazo de referência de 220 meses',
  },
  automovel: {
    id: 'automovel',
    category: 'vehicle',
    label: 'Automóvel',
    noun: 'automóvel',
    factor: '1.162',
    termMonths: 90,
    credit: {
      min: 35_000,
      max: 400_000,
      step: 1_000,
      default: 100_000,
      quickPicks: [60_000, 100_000, 150_000, 250_000],
    },
    rangeSummary: 'Créditos a partir de R$ 35 mil',
  },
  moto: {
    id: 'moto',
    category: 'vehicle',
    label: 'Motocicleta',
    noun: 'motocicleta',
    factor: '1.282',
    termMonths: 60,
    credit: {
      min: 8_000,
      max: 30_000,
      step: 500,
      default: 20_000,
      quickPicks: [12_000, 18_000, 22_000, 30_000],
    },
    rangeSummary: 'Créditos até R$ 30 mil',
  },
};

/**
 * Faixa entre motocicletas e automóveis sem regra validada.
 * Valores estritamente entre `from` e `to` não são calculados.
 */
export const UNVALIDATED_VEHICLE_RANGE = {
  from: 30_000,
  to: 35_000,
  message:
    'Para créditos entre R$ 30 mil e R$ 35 mil, a simulação é feita com um especialista. Fale com a gente para conhecer as opções dessa faixa.',
} as const;

export const SIMULATION_DISCLAIMER =
  'Simulação ilustrativa. Valores sujeitos à confirmação das condições do plano, composição da parcela e regras da administradora.';

/** Tempo (ms) sem alterações para considerar a simulação concluída. */
export const SIMULATION_SETTLE_MS = 1200;
