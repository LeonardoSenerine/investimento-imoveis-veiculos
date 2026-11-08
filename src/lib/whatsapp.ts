import { PLANS } from '../config/simulators';
import { SITE } from '../config/site';
import type { Feasibility, HeatZone } from './feasibility';
import { formatReais } from './money';

/**
 * Monta o link do WhatsApp. Sem número configurado, usa o link genérico
 * (a pessoa escolhe o contato); o modo demonstração sinaliza essa situação.
 */
export function whatsappUrl(message: string = SITE.defaultWhatsAppMessage): string {
  const text = encodeURIComponent(message);
  return SITE.whatsappNumber ? `https://wa.me/${SITE.whatsappNumber}?text=${text}` : `https://wa.me/?text=${text}`;
}

const ZONE_LINE: Record<HeatZone, string> = {
  quente: 'Minha zona de calor deu quente. Quero saber como.',
  morno: 'Minha zona de calor deu morna. Quero ajuda para chegar lá.',
  frio: 'Minha zona de calor deu fria. Quero montar um plano possível.',
};

/** Mensagem da zona de calor: o especialista recebe tudo o que a pessoa simulou. */
export function heatZoneMessage(f: Feasibility, name?: string): string {
  const plan = PLANS[f.request.planId];
  const own = plan.feminine ? 'minha' : 'meu';
  return [
    name ? `Olá! Meu nome é ${name.trim().split(' ')[0]}.` : 'Olá!',
    `Fiz a simulação no site para ${own} ${plan.noun}:`,
    `Consigo guardar: R$ ${formatReais(f.request.monthlyReais)} por mês`,
    `Preciso de: R$ ${formatReais(f.request.creditReais)}`,
    `Prazo: ${f.request.termMonths} meses`,
    ZONE_LINE[f.zone],
  ].join('\n');
}

/** Para valores que o simulador ainda não calcula. */
export function specialistMessage(planNoun: string, creditLabel: string, feminine: boolean): string {
  return `Olá! Quero planejar ${feminine ? 'uma' : 'um'} ${planNoun} de ${creditLabel}. Pode me ajudar com essa simulação?`;
}
