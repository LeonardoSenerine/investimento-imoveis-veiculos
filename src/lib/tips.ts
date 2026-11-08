import type { Tip } from './feasibility';
import { formatCents, formatReais } from './money';

/** Texto de cada dica, em linguagem direta. */
export function tipText(tip: Tip): string {
  switch (tip.kind) {
    case 'term':
      return `Com prazo de ${tip.termMonths} meses, a parcela de referência cai para ${formatCents(tip.installmentCents)} e cabe no que você guarda.`;
    case 'credit':
      return `No mesmo prazo, o que você guarda hoje já cobre até R$ ${formatReais(tip.creditReais)} de crédito.`;
    case 'monthly':
      return `Guardando ${formatCents(tip.extraCents)} a mais por mês, você chega lá.`;
  }
}

/** Rótulo do botão que aplica a dica no simulador "E se…". */
export function tipAction(tip: Tip): string {
  switch (tip.kind) {
    case 'term':
      return `Usar ${tip.termMonths} meses`;
    case 'credit':
      return `Usar R$ ${formatReais(tip.creditReais)}`;
    case 'monthly':
      return `Guardar ${formatCents(tip.extraCents)} a mais`;
  }
}
