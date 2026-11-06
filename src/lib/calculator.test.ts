import { describe, expect, it } from 'vitest';
import { simulate } from './calculator';
import { formatCents, parseReaisInput } from './money';

const installment = (planId: Parameters<typeof simulate>[0], value: number) => {
  const r = simulate(planId, value);
  if (r.status !== 'ok') throw new Error(`esperado ok, recebido ${r.status}`);
  return formatCents(r.installmentCents);
};

describe('fórmulas preliminares do cliente', () => {
  it('imóvel: R$ 500.000 → R$ 2.822,73', () => {
    expect(installment('imovel', 500_000)).toBe('R$ 2.822,73');
  });
  it('moto: R$ 20.000 → R$ 427,33', () => {
    expect(installment('moto', 20_000)).toBe('R$ 427,33');
  });
  it('automóvel: R$ 100.000 → R$ 1.291,11', () => {
    expect(installment('automovel', 100_000)).toBe('R$ 1.291,11');
  });
  it('arredonda ao centavo mais próximo (half-up)', () => {
    // 35.000 × 1,162 ÷ 90 = 451,8888… → 451,89
    expect(installment('automovel', 35_000)).toBe('R$ 451,89');
  });
});

describe('faixas', () => {
  it('não calcula entre R$ 30 mil e R$ 35 mil', () => {
    expect(simulate('moto', 32_000).status).toBe('unvalidated_range');
    expect(simulate('automovel', 34_999).status).toBe('unvalidated_range');
  });
  it('limites exatos são válidos', () => {
    expect(simulate('moto', 30_000).status).toBe('ok');
    expect(simulate('automovel', 35_000).status).toBe('ok');
  });
  it('sugere o plano adequado fora da faixa', () => {
    const r = simulate('moto', 80_000);
    expect(r.status).toBe('out_of_range');
    if (r.status === 'out_of_range') expect(r.suggestedPlanId).toBe('automovel');
  });
  it('campo vazio', () => {
    expect(simulate('imovel', null).status).toBe('empty');
  });
});

describe('entrada monetária', () => {
  it('extrai dígitos', () => {
    expect(parseReaisInput('R$ 1.250.000')).toBe(1_250_000);
    expect(parseReaisInput('')).toBeNull();
    expect(parseReaisInput('000150')).toBe(150);
  });
});
