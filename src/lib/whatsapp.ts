import { SITE } from '../config/site';
import type { SimulationSnapshot } from '../types';
import { formatCents } from './money';

/**
 * Monta o link do WhatsApp. Sem número configurado, usa o link genérico
 * (o usuário escolhe o contato) — o modo demonstração sinaliza essa situação.
 */
export function whatsappUrl(message: string = SITE.defaultWhatsAppMessage): string {
  const text = encodeURIComponent(message);
  return SITE.whatsappNumber
    ? `https://wa.me/${SITE.whatsappNumber}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

export function simulationMessage(snapshot: SimulationSnapshot, name?: string): string {
  const greeting = name ? `Olá! Meu nome é ${name.trim().split(' ')[0]}.` : 'Olá!';
  return [
    greeting,
    `Fiz uma simulação de consórcio de ${snapshot.planNoun} no site:`,
    `Crédito: ${formatCents(snapshot.creditCents)}`,
    `Prazo de referência: ${snapshot.termMonths} meses`,
    `Parcela estimada: ${formatCents(snapshot.installmentCents)}`,
    'Gostaria de conhecer as condições disponíveis.',
  ].join('\n');
}

export function rangeHelpMessage(planNoun: string, creditLabel: string): string {
  return `Olá! Tenho interesse em um consórcio de ${planNoun} com crédito de ${creditLabel}. Pode me ajudar com essa simulação?`;
}
