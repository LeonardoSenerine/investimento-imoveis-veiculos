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

export function simulationMessage(snapshot: SimulationSnapshot, name?: string, timeframe?: string | null): string {
  const greeting = name ? `Olá! Meu nome é ${name.trim().split(' ')[0]}.` : 'Olá!';
  return [
    greeting,
    `Fiz uma simulação no site para planejar ${snapshot.planNoun === 'motocicleta' ? 'minha' : 'meu'} ${snapshot.planNoun}:`,
    `Posso investir: ${formatCents(snapshot.monthlyBudgetCents)} por mês`,
    `Crédito estimado: ${formatCents(snapshot.creditCents)}`,
    `Prazo: ${snapshot.termMonths} meses`,
    ...(timeframe ? [`Quando pretendo: ${timeframe.toLowerCase()}`] : []),
    'Gostaria de conhecer as condições.',
  ].join('\n');
}

export function rangeHelpMessage(planNoun: string, monthlyLabel: string): string {
  return `Olá! Quero planejar ${planNoun === 'motocicleta' ? 'uma' : 'um'} ${planNoun} e posso investir ${monthlyLabel} por mês. Pode me ajudar com essa simulação?`;
}
