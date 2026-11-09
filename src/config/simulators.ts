/**
 * Regras de cálculo informadas pelo cliente (mensagem de 09/11/2026).
 *
 * Parcela cheia     = (valor × fator) ÷ prazo
 * Parcela reduzida  = (valor ÷ prazo) × percentual  +  (valor × (fator − 1)) ÷ prazo
 *
 * A taxa de administração (fator − 1) não é reduzida: entra inteira nas duas.
 * Cada parte é arredondada para centavos antes da soma, como no exemplo do
 * cliente (636,36 + 218,18 = 854,54).
 *
 *  - Imóvel: fator 1,24, 220 meses, parcela reduzida 70%.
 *  - Veículo a partir de R$ 30 mil: fator 1,162, 90 meses, parcela reduzida 50%.
 *  - Veículo abaixo de R$ 30 mil: fator 1,282, 60 meses, somente parcela cheia.
 */

export type Objective = 'imovel' | 'veiculo';
export type RuleId = 'imovel' | 'veiculo' | 'veiculo_ate_30k';

export interface ObjectiveConfig {
  id: Objective;
  /** Rótulo do botão de escolha. */
  label: string;
  /** Usado nas frases: "o valor do imóvel", "um veículo". */
  noun: string;
  /** Faixa de valores aceita pelo simulador, em reais. */
  value: { min: number; max: number };
}

export const OBJECTIVES: Record<Objective, ObjectiveConfig> = {
  imovel: { id: 'imovel', label: 'Imóvel', noun: 'imóvel', value: { min: 50_000, max: 10_000_000 } },
  veiculo: { id: 'veiculo', label: 'Veículo', noun: 'veículo', value: { min: 5_000, max: 1_000_000 } },
};

export const OBJECTIVE_ORDER: Objective[] = ['imovel', 'veiculo'];

export interface Rule {
  id: RuleId;
  /** Fator com a taxa de administração embutida, como string decimal ("1.24"). */
  factor: string;
  termMonths: number;
  /** Percentual da parcela reduzida ("0.70"); null quando só existe parcela cheia. */
  reducedShare: string | null;
}

export const RULES: Record<RuleId, Rule> = {
  imovel: { id: 'imovel', factor: '1.24', termMonths: 220, reducedShare: '0.70' },
  veiculo: { id: 'veiculo', factor: '1.162', termMonths: 90, reducedShare: '0.50' },
  veiculo_ate_30k: { id: 'veiculo_ate_30k', factor: '1.282', termMonths: 60, reducedShare: null },
};

/** A partir deste valor (inclusive), o veículo usa a parcela reduzida de 50%. */
export const VEHICLE_REDUCED_FROM = 30_000;

/**
 * Aviso no rodapé do resultado. A pedido do cliente o site não fala em parcela
 * cheia/reduzida; o aviso mantém, de forma neutra, que o valor mensal pode variar.
 */
export const SIMULATION_DISCLAIMER =
  'Simulação ilustrativa. O valor mensal pode variar ao longo do plano. Valores, prazos e a forma de liberação do crédito são apresentados no atendimento, antes de qualquer contratação.';
