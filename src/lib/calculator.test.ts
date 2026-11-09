import { describe, expect, it } from 'vitest';
import { checkValue, headlineCents, quote, ruleFor } from './calculator';
import { formatCents } from './money';

const brl = (cents: bigint | null) => (cents === null ? null : formatCents(cents));

describe('exemplos do cliente', () => {
  it('imóvel R$ 200.000: cheia R$ 1.127,27 e reduzida 70% R$ 854,54 em 220 meses', () => {
    const q = quote('imovel', 200_000);
    expect(q.termMonths).toBe(220);
    expect(brl(q.fullCents)).toBe('R$ 1.127,27');
    expect(brl(q.reducedCents)).toBe('R$ 854,54');
    expect(q.reducedPercent).toBe(70);
  });

  it('veículo R$ 40.000: cheia R$ 516,44 e reduzida 50% R$ 294,22 em 90 meses', () => {
    const q = quote('veiculo', 40_000);
    expect(q.termMonths).toBe(90);
    expect(brl(q.fullCents)).toBe('R$ 516,44');
    expect(brl(q.reducedCents)).toBe('R$ 294,22');
    expect(q.reducedPercent).toBe(50);
  });

  it('veículo R$ 20.000: somente parcela cheia, R$ 427,33 em 60 meses', () => {
    const q = quote('veiculo', 20_000);
    expect(q.termMonths).toBe(60);
    expect(brl(q.fullCents)).toBe('R$ 427,33');
    expect(q.reducedCents).toBeNull();
    expect(brl(headlineCents(q))).toBe('R$ 427,33');
  });
});

describe('limite de R$ 30 mil no veículo', () => {
  it('R$ 29.999 usa a parcela cheia de 60 meses', () => {
    expect(ruleFor('veiculo', 29_999).id).toBe('veiculo_ate_30k');
  });
  it('R$ 30.000 já usa a parcela reduzida de 90 meses', () => {
    expect(ruleFor('veiculo', 30_000).id).toBe('veiculo');
  });
  it('imóvel ignora o limite', () => {
    expect(ruleFor('imovel', 10_000).id).toBe('imovel');
  });
});

describe('taxa de administração não é reduzida', () => {
  it('reduzida = parte do valor + taxa inteira', () => {
    const q = quote('imovel', 200_000);
    // 636,36 (70% de 909,09) + 218,18 (48.000 ÷ 220)
    expect(q.reducedCents).toBe(63_636n + 21_818n);
  });
});

describe('validação do valor', () => {
  it('vazio', () => expect(checkValue('imovel', null)).toEqual({ ok: false, reason: 'empty' }));
  it('abaixo do mínimo', () => expect(checkValue('imovel', 10_000)).toEqual({ ok: false, reason: 'below_min' }));
  it('acima do máximo', () => expect(checkValue('veiculo', 5_000_000)).toEqual({ ok: false, reason: 'above_max' }));
  it('dentro da faixa', () => expect(checkValue('veiculo', 40_000)).toEqual({ ok: true }));
});
