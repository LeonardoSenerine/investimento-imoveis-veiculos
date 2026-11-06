/**
 * Aritmética monetária exata com BigInt (centavos).
 * Evita erros de ponto flutuante em multiplicações e divisões.
 */

export interface Decimal {
  /** Valor inteiro escalado. Ex.: "1.242" → 1242n */
  units: bigint;
  /** Escala. Ex.: "1.242" → 1000n */
  scale: bigint;
}

export function parseDecimal(value: string): Decimal {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) throw new Error(`Decimal inválido: "${value}"`);
  const [, int, frac = ''] = match;
  return {
    units: BigInt(int + frac),
    scale: 10n ** BigInt(frac.length),
  };
}

/** Reais inteiros → centavos. */
export function reaisToCents(reais: number): bigint {
  if (!Number.isSafeInteger(reais) || reais < 0) {
    throw new Error(`Valor em reais inválido: ${reais}`);
  }
  return BigInt(reais) * 100n;
}

/** Divisão inteira com arredondamento "half-up" (valores não negativos). */
export function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n || numerator < 0n) throw new Error('Divisão inválida');
  return (numerator * 2n + denominator) / (denominator * 2n);
}

const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Centavos → "R$ 2.822,73" (ou sem prefixo). */
export function formatCents(cents: bigint, { prefix = true } = {}): string {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const int = groupThousands((abs / 100n).toString());
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${negative ? '-' : ''}${prefix ? 'R$ ' : ''}${int},${frac}`;
}

/** Separa centavos em partes para composição tipográfica. */
export function splitCents(cents: bigint) {
  return {
    int: groupThousands((cents / 100n).toString()),
    frac: (cents % 100n).toString().padStart(2, '0'),
  };
}

/** Reais inteiros → "500.000" */
export function formatReais(reais: number): string {
  return groupThousands(Math.trunc(reais).toString());
}

/** Reais inteiros → "R$ 35 mil" / "R$ 1,2 mi" para rótulos curtos. */
export function formatReaisShort(reais: number): string {
  if (reais >= 1_000_000) {
    const value = reais / 1_000_000;
    return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  }
  if (reais >= 1_000) {
    // 20.700 → "20,7 mil" (uma casa decimal, sem arredondar para cima)
    const value = Math.floor(reais / 100) / 10;
    return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  }
  return `R$ ${formatReais(reais)}`;
}

/** Converte texto digitado em reais inteiros (ignora tudo que não for dígito). */
export function parseReaisInput(text: string, maxDigits = 9): number | null {
  const onlyDigits = text.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, maxDigits);
  return onlyDigits ? Number(onlyDigits) : null;
}

/** Centavos → string decimal "2822.73" para APIs. */
export function centsToDecimalString(cents: bigint): string {
  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`;
}
