/**
 * Perguntas de qualificação respondidas por toque, antes do nome e WhatsApp.
 * Cada opção tem um peso de "temperatura" para o especialista priorizar o
 * atendimento. Os pesos são uma heurística inicial: ajuste com os resultados reais.
 */

export type QuestionId = 'timeframe' | 'savings' | 'purchaseType' | 'bestTime';

export interface QuestionOption {
  value: string;
  label: string;
  /** Contribuição para a temperatura do lead. */
  weight: number;
}

export interface Question {
  id: QuestionId;
  /** Recebe o substantivo do objetivo ("imóvel", "automóvel", "motocicleta"). */
  label: (noun: string) => string;
  options: (noun: string) => QuestionOption[];
}

/** Concordância de gênero: "meu primeiro imóvel" / "minha primeira motocicleta". */
const fem = (noun: string) => noun === 'motocicleta';

export const QUESTIONS: Question[] = [
  {
    id: 'timeframe',
    label: () => 'Quando você pretende conquistar?',
    options: () => [
      { value: 'asap', label: 'O quanto antes', weight: 2 },
      { value: 'within_1y', label: 'Em até 1 ano', weight: 2 },
      { value: 'planning', label: 'Sem pressa, quero planejar', weight: 0 },
    ],
  },
  {
    id: 'savings',
    label: () => 'Você tem algum valor guardado hoje?',
    options: () => [
      { value: 'yes', label: 'Sim', weight: 2 },
      { value: 'no', label: 'Não', weight: 0 },
      { value: 'talk', label: 'Prefiro conversar sobre isso', weight: 1 },
    ],
  },
  {
    id: 'purchaseType',
    label: (noun) => `${fem(noun) ? 'Essa' : 'Esse'} ${noun} vai ser:`,
    options: (noun) => [
      { value: 'first', label: `${fem(noun) ? 'Minha primeira' : 'Meu primeiro'} ${noun}`, weight: 1 },
      { value: 'upgrade', label: `Troca ${fem(noun) ? 'da atual' : 'do atual'}`, weight: 1 },
      { value: 'investment', label: 'Investimento', weight: 1 },
    ],
  },
  {
    id: 'bestTime',
    label: () => 'Melhor horário para falar com você',
    options: () => [
      { value: 'morning', label: 'Manhã', weight: 0 },
      { value: 'afternoon', label: 'Tarde', weight: 0 },
      { value: 'evening', label: 'Noite', weight: 0 },
    ],
  },
];

export type Answers = Record<QuestionId, string | null>;

export const emptyAnswers = (): Answers => ({ timeframe: null, savings: null, purchaseType: null, bestTime: null });

export type LeadTemperature = 'quente' | 'morno' | 'frio';

export function scoreAnswers(answers: Answers, noun = ''): { score: number; temperature: LeadTemperature } {
  const score = QUESTIONS.reduce((sum, q) => {
    const opt = q.options(noun).find((o) => o.value === answers[q.id]);
    return sum + (opt?.weight ?? 0);
  }, 0);
  // Máximo 5: prazo curto (2) + valor guardado (2) + tipo de compra (1).
  const temperature: LeadTemperature = score >= 4 ? 'quente' : score >= 2 ? 'morno' : 'frio';
  return { score, temperature };
}

/** Rótulo legível de uma resposta (para mensagens e resumo). */
export function answerLabel(id: QuestionId, value: string | null, noun: string): string | null {
  const q = QUESTIONS.find((x) => x.id === id);
  return q?.options(noun).find((o) => o.value === value)?.label ?? null;
}
