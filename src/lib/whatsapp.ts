import { OBJECTIVES } from '../config/simulators';
import { SITE } from '../config/site';
import type { Contact, SimulationResult } from '../types';
import { formatCents, formatReais } from './money';
import { maskPhoneBR } from './validation';

/**
 * Monta o link do WhatsApp. Sem número configurado, usa o link genérico
 * (a pessoa escolhe o contato); o modo demonstração sinaliza essa situação.
 */
export function whatsappUrl(message: string = SITE.defaultWhatsAppMessage): string {
  const text = encodeURIComponent(message);
  return SITE.whatsappNumber ? `https://wa.me/${SITE.whatsappNumber}?text=${text}` : `https://wa.me/?text=${text}`;
}

/** Número do consultor para exibir: "(11) 96332-9968". */
export const whatsappDisplay = () => (SITE.whatsappNumber ? maskPhoneBR(SITE.whatsappNumber.replace(/^55/, '')) : '');

/** Mensagem pronta: o consultor recebe tudo o que a pessoa simulou. */
export function resultMessage(r: SimulationResult, contact?: Contact | null): string {
  const { quote: q, profile } = r;
  const noun = OBJECTIVES[q.objective].noun;
  return [
    contact ? `Olá! Meu nome é ${contact.name}.` : 'Olá!',
    'Fiz a simulação no site:',
    `${noun.charAt(0).toUpperCase()}${noun.slice(1)} de R$ ${formatReais(q.valueReais)}`,
    q.reducedCents !== null
      ? `Parcela reduzida: ${formatCents(q.reducedCents)} (${q.termMonths} meses)`
      : `Parcela: ${formatCents(q.fullCents)} (${q.termMonths} meses)`,
    q.reducedCents !== null ? `Parcela cheia: ${formatCents(q.fullCents)}` : null,
    `Renda mensal: R$ ${formatReais(profile.incomeReais)}`,
    profile.hasSavings && profile.savingsReais
      ? `Dinheiro guardado: R$ ${formatReais(profile.savingsReais)}`
      : 'Dinheiro guardado: não tenho',
    'Quero saber como fazer esse investimento.',
  ]
    .filter(Boolean)
    .join('\n');
}
