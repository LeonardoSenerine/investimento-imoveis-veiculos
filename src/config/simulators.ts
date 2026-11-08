/**
 * CONFIGURAÇÃO DA SIMULAÇÃO
 * ---------------------------------------------------------------------------
 * ATENÇÃO: os fatores e prazos abaixo são PARÂMETROS PRELIMINARES fornecidos
 * pelo cliente e ainda precisam de validação comercial e documental.
 *
 * Fórmula:
 *   parcela de referência = (crédito × fator) ÷ prazo
 *
 * A pessoa informa quanto consegue guardar por mês, de quanto crédito precisa
 * e o prazo. Comparando o valor mensal com a parcela de referência, o site diz
 * se o planejamento cabe e em qual "zona de calor" ela está.
 *
 * - `factor` é string para preservar a precisão decimal (nunca usar float).
 * - O mesmo fator vale para todos os prazos (decisão provisória).
 * - Nenhum número de regra deve ser fixado fora deste arquivo.
 */

export type PlanId = 'imovel' | 'automovel' | 'moto';
export type Category = 'property' | 'vehicle';

export interface CreditRange {
  /** Valores em reais inteiros. */
  min: number;
  max: number;
  /** Arredondamento das sugestões de crédito. */
  step: number;
}

export interface PlanConfig {
  id: PlanId;
  category: Category;
  label: string;
  /** Usado em frases: "planejar seu imóvel", "planejar sua moto". */
  noun: string;
  /** Gênero do substantivo, para concordância ("seu carro", "sua moto"). */
  feminine: boolean;
  factor: string;
  /** Prazo padrão (o prazo para o qual o cliente informou o fator). */
  termMonths: number;
  termOptions: number[];
  credit: CreditRange;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  imovel: {
    id: 'imovel',
    category: 'property',
    label: 'Imóvel',
    noun: 'imóvel',
    feminine: false,
    factor: '1.242',
    termMonths: 220,
    termOptions: [120, 150, 180, 200, 220, 240],
    credit: { min: 100_000, max: 2_000_000, step: 5_000 },
  },
  automovel: {
    id: 'automovel',
    category: 'vehicle',
    label: 'Carro',
    noun: 'carro',
    feminine: false,
    factor: '1.162',
    termMonths: 90,
    termOptions: [36, 48, 60, 72, 80, 90, 100],
    credit: { min: 35_000, max: 400_000, step: 1_000 },
  },
  moto: {
    id: 'moto',
    category: 'vehicle',
    label: 'Moto',
    noun: 'moto',
    feminine: true,
    factor: '1.282',
    termMonths: 60,
    termOptions: [24, 36, 48, 60, 72],
    credit: { min: 8_000, max: 30_000, step: 500 },
  },
};

export const PLAN_ORDER: PlanId[] = ['imovel', 'automovel', 'moto'];

/**
 * Faixa entre motos e carros sem regra validada.
 * Valores estritamente entre `from` e `to` não são calculados.
 */
export const UNVALIDATED_VEHICLE_RANGE = { from: 30_000, to: 35_000 } as const;

/**
 * Zona de calor: razão entre o que a pessoa guarda por mês e a parcela de
 * referência. A partir de `hot` o planejamento cabe; entre `warm` e `hot` ela
 * está perto; abaixo de `warm`, ainda não fecha.
 */
export const HEAT = { warm: 0.75, hot: 1 } as const;

export const SIMULATION_DISCLAIMER =
  'Simulação ilustrativa. Valores, prazos e a forma de liberação do crédito são apresentados no atendimento, antes de qualquer contratação.';
