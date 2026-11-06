import { describe, expect, it } from 'vitest';
import { PLANS } from '../config/simulators';
import { monthlyRange, simulate, simulateFromMonthly } from './calculator';
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

describe('fluxo pelo valor mensal (fórmula inversa)', () => {
  const credit = (planId: Parameters<typeof simulate>[0], monthly: number) => {
    const r = simulateFromMonthly(planId, monthly);
    if (r.status !== 'ok') throw new Error(`esperado ok, recebido ${r.status}`);
    return { credit: r.creditReais, installment: formatCents(r.installmentCents) };
  };

  it('imóvel: R$ 2.800/mês → crédito de R$ 495.000 (parcela de referência R$ 2.794,50)', () => {
    expect(credit('imovel', 2_800)).toEqual({ credit: 495_000, installment: 'R$ 2.794,50' });
  });
  it('automóvel: R$ 1.300/mês → R$ 100.000 (exemplo do cliente)', () => {
    expect(credit('automovel', 1_300)).toEqual({ credit: 100_000, installment: 'R$ 1.291,11' });
  });
  it('moto: R$ 430/mês → R$ 20.000 (exemplo do cliente)', () => {
    expect(credit('moto', 430)).toEqual({ credit: 20_000, installment: 'R$ 427,33' });
  });
  it('a parcela de referência nunca ultrapassa o valor mensal informado', () => {
    for (const planId of ['imovel', 'automovel', 'moto'] as const) {
      const { min, max } = monthlyRange(PLANS[planId]);
      for (let m = min; m <= max; m += Math.max(1, Math.round((max - min) / 37))) {
        const r = simulateFromMonthly(planId, m);
        expect(r.status).toBe('ok');
        if (r.status === 'ok') expect(r.installmentCents <= BigInt(m) * 100n).toBe(true);
      }
    }
  });
  it('faixas mensais derivadas da faixa de crédito', () => {
    expect(monthlyRange(PLANS.imovel)).toEqual({ min: 600, max: 11_250 });
    expect(monthlyRange(PLANS.automovel)).toEqual({ min: 460, max: 5_160 });
    expect(monthlyRange(PLANS.moto)).toEqual({ min: 175, max: 640 });
  });
  it('valor mensal fora da faixa não inventa crédito', () => {
    expect(simulateFromMonthly('automovel', 300).status).toBe('out_of_range');
    expect(simulateFromMonthly('moto', 660).status).toBe('unvalidated_range');
    expect(simulateFromMonthly('imovel', null).status).toBe('empty');
  });
});

describe('prazo escolhido pela pessoa (mesmo fator em todos os prazos)', () => {
  it('imóvel: R$ 2.800/mês em 120 meses → R$ 270.000 (parcela R$ 2.794,50)', () => {
    const r = simulateFromMonthly('imovel', 2_800, 120);
    expect(r.status).toBe('ok');
    if (r.status === 'ok') {
      expect(r.creditReais).toBe(270_000);
      expect(r.termMonths).toBe(120);
      expect(formatCents(r.installmentCents)).toBe('R$ 2.794,50');
    }
  });
  it('prazo maior rende mais crédito com o mesmo valor mensal', () => {
    const credit = (t: number) => {
      const r = simulateFromMonthly('automovel', 1_300, t);
      return r.status === 'ok' ? r.creditReais : 0;
    };
    expect(credit(36)).toBeLessThan(credit(60));
    expect(credit(60)).toBeLessThan(credit(100));
  });
  it('faixa mensal acompanha o prazo', () => {
    expect(monthlyRange(PLANS.imovel, 120)).toEqual({ min: 1_050, max: 20_700 });
    expect(monthlyRange(PLANS.moto, 24).min).toBeGreaterThan(monthlyRange(PLANS.moto, 72).min);
  });
  it('prazo fora das opções volta ao padrão', () => {
    const r = simulateFromMonthly('imovel', 2_800, 999);
    expect(r.status === 'ok' && r.termMonths).toBe(220);
  });
  it('parcela nunca passa do valor mensal em nenhum prazo', () => {
    for (const planId of ['imovel', 'automovel', 'moto'] as const) {
      for (const t of PLANS[planId].termOptions) {
        const { min, max } = monthlyRange(PLANS[planId], t);
        for (let m = min; m <= max; m += Math.max(1, Math.round((max - min) / 23))) {
          const r = simulateFromMonthly(planId, m, t);
          expect(r.status).toBe('ok');
          if (r.status === 'ok') expect(r.installmentCents <= BigInt(m) * 100n).toBe(true);
        }
      }
    }
  });
});

describe('entrada monetária', () => {
  it('extrai dígitos', () => {
    expect(parseReaisInput('R$ 1.250.000')).toBe(1_250_000);
    expect(parseReaisInput('')).toBeNull();
    expect(parseReaisInput('000150')).toBe(150);
  });
});
