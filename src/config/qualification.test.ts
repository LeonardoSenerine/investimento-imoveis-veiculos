import { describe, expect, it } from 'vitest';
import { answerLabel, scoreAnswers } from './qualification';

describe('temperatura do lead', () => {
  it('prazo curto + valor guardado = quente', () => {
    expect(
      scoreAnswers({ timeframe: 'asap', savings: 'yes', purchaseType: 'first', bestTime: 'evening' }).temperature,
    ).toBe('quente');
  });
  it('prazo curto sem valor guardado = morno', () => {
    expect(
      scoreAnswers({ timeframe: 'within_1y', savings: 'no', purchaseType: 'upgrade', bestTime: 'morning' })
        .temperature,
    ).toBe('morno');
  });
  it('sem pressa e sem valor guardado = frio', () => {
    expect(
      scoreAnswers({ timeframe: 'planning', savings: 'no', purchaseType: null, bestTime: 'afternoon' }).temperature,
    ).toBe('frio');
  });
  it('rótulos com concordância de gênero', () => {
    expect(answerLabel('purchaseType', 'first', 'motocicleta')).toBe('Minha primeira motocicleta');
    expect(answerLabel('purchaseType', 'first', 'imóvel')).toBe('Meu primeiro imóvel');
  });
});
