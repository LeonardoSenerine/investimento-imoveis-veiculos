import { describe, expect, it } from 'vitest';
import { PLANS } from '../config/simulators';
import { checkCredit, estimateCreditFromMonthly, estimateInstallmentCents } from './calculator';
import { evaluate } from './feasibility';
import { formatCents, parseReaisInput } from './money';

const installment = (planId: keyof typeof PLANS, credit: number, term?: number) =>
  formatCents(estimateInstallmentCents(PLANS[planId], credit, term));

describe('fórmulas preliminares do cliente', () => {
  it('imóvel: R$ 500.000 em 220 meses → R$ 2.822,73', () => {
    expect(installment('imovel', 500_000)).toBe('R$ 2.822,73');
  });
  it('moto: R$ 20.000 em 60 meses → R$ 427,33', () => {
    expect(installment('moto', 20_000)).toBe('R$ 427,33');
  });
  it('carro: R$ 100.000 em 90 meses → R$ 1.291,11', () => {
    expect(installment('automovel', 100_000)).toBe('R$ 1.291,11');
  });
  it('arredonda ao centavo mais próximo (half-up)', () => {
    expect(installment('automovel', 35_000)).toBe('R$ 451,89');
  });
  it('prazo fora das opções volta ao padrão', () => {
    expect(installment('imovel', 500_000, 999)).toBe('R$ 2.822,73');
  });
  it('fórmula inversa arredonda o crédito para baixo', () => {
    expect(estimateCreditFromMonthly(PLANS.automovel, 1_000, 90)).toBe(77_000);
  });
});

describe('faixas de crédito', () => {
  it('não calcula entre R$ 30 mil e R$ 35 mil', () => {
    expect(checkCredit('moto', 32_000)).toEqual({ ok: false, reason: 'unvalidated' });
    expect(checkCredit('automovel', 34_999)).toEqual({ ok: false, reason: 'unvalidated' });
  });
  it('limites exatos são válidos', () => {
    expect(checkCredit('moto', 30_000).ok).toBe(true);
    expect(checkCredit('automovel', 35_000).ok).toBe(true);
  });
  it('sugere o tipo certo fora da faixa', () => {
    expect(checkCredit('moto', 80_000)).toEqual({ ok: false, reason: 'above_max', suggestedPlanId: 'automovel' });
  });
  it('vazio', () => {
    expect(checkCredit('imovel', null)).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('zona de calor', () => {
  it('exemplo do cliente: guarda R$ 10 mil e precisa de R$ 100 mil → quente', () => {
    const r = evaluate({ planId: 'imovel', monthlyReais: 10_000, creditReais: 100_000, termMonths: 220 });
    expect(r.fits).toBe(true);
    expect(r.zone).toBe('quente');
    expect(r.heat).toBe(1);
    expect(r.tips).toEqual([]);
  });
  it('cabe com folga pequena → quente, informa a sobra', () => {
    const r = evaluate({ planId: 'automovel', monthlyReais: 1_300, creditReais: 100_000, termMonths: 90 });
    expect(r.zone).toBe('quente');
    expect(formatCents(r.leftoverCents)).toBe('R$ 8,89');
  });
  it('perto (75% a 99%) → morno, com dicas concretas', () => {
    const r = evaluate({ planId: 'automovel', monthlyReais: 1_000, creditReais: 100_000, termMonths: 90 });
    expect(r.zone).toBe('morno');
    expect(r.fits).toBe(false);
    // 100 meses ainda não cabe (R$ 1.162,00), então não há dica de prazo.
    expect(r.tips.map((t) => t.kind)).toEqual(['credit', 'monthly']);
    const credit = r.tips.find((t) => t.kind === 'credit');
    expect(credit && credit.kind === 'credit' && credit.creditReais).toBe(77_000);
    const monthly = r.tips.find((t) => t.kind === 'monthly');
    expect(monthly && monthly.kind === 'monthly' && formatCents(monthly.extraCents)).toBe('R$ 292,00');
  });
  it('dica de prazo maior quando ele resolve', () => {
    const r = evaluate({ planId: 'automovel', monthlyReais: 1_200, creditReais: 100_000, termMonths: 90 });
    const term = r.tips.find((t) => t.kind === 'term');
    expect(term && term.kind === 'term' && term.termMonths).toBe(100);
    expect(term && term.kind === 'term' && formatCents(term.installmentCents)).toBe('R$ 1.162,00');
  });
  it('longe (abaixo de 75%) → frio', () => {
    const r = evaluate({ planId: 'automovel', monthlyReais: 500, creditReais: 100_000, termMonths: 90 });
    expect(r.zone).toBe('frio');
    expect(r.heat).toBeGreaterThan(0);
    expect(r.heat).toBeLessThan(0.54);
  });
  it('dica de crédito some quando o que cabe fica abaixo da faixa do plano', () => {
    const r = evaluate({ planId: 'imovel', monthlyReais: 300, creditReais: 500_000, termMonths: 220 });
    expect(r.tips.some((t) => t.kind === 'credit')).toBe(false);
  });
});

describe('entrada monetária', () => {
  it('extrai dígitos', () => {
    expect(parseReaisInput('R$ 1.250.000')).toBe(1_250_000);
    expect(parseReaisInput('')).toBeNull();
    expect(parseReaisInput('000150')).toBe(150);
  });
});
