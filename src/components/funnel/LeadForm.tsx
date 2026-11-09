import { useState, type FormEvent } from 'react';
import { OBJECTIVE_ORDER, OBJECTIVES, type Objective } from '../../config/simulators';
import { isLeadApiConfigured } from '../../config/site';
import { checkValue } from '../../lib/calculator';
import { formatReaisShort } from '../../lib/money';
import { maskPhoneBR, toE164BR, validateName, validatePhoneBR } from '../../lib/validation';
import type { Contact, Profile } from '../../types';
import { usePrivacy } from '../privacy/PrivacyContext';
import { Button } from '../ui/Button';
import { ChoiceGroup, MoneyField, TextField } from './fields';

export interface FormDraft {
  objective: Objective;
  income: number | null;
  hasSavings: 'sim' | 'nao' | null;
  savings: number | null;
  value: number | null;
  name: string;
  phone: string;
  honeypot: string;
}

export const initialDraft = (): FormDraft => ({
  objective: 'imovel',
  income: null,
  hasSavings: null,
  savings: null,
  value: null,
  name: '',
  phone: '',
  honeypot: '',
});

export interface FormSubmit {
  objective: Objective;
  valueReais: number;
  profile: Profile;
  contact: Contact;
  honeypot: string;
}

interface Props {
  draft: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  /** Envia e abre o resultado; resolve quando a página de resultado pode abrir. */
  onSubmit: (data: FormSubmit) => Promise<void>;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

/** "a, b e c" */
const listPt = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;

/** Etapa única: objetivo, renda, dinheiro guardado, valor desejado e contato. */
export function LeadForm({ draft, onChange, onSubmit }: Props) {
  const { openPrivacy } = usePrivacy();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const touch = (field: string) => () => setTouched((t) => ({ ...t, [field]: true }));

  const obj = OBJECTIVES[draft.objective];
  const valueCheck = checkValue(draft.objective, draft.value);
  const range = `De ${formatReaisShort(obj.value.min)} a ${formatReaisShort(obj.value.max)}`;

  const errors = {
    income: draft.income === null || draft.income <= 0 ? 'Informe sua renda mensal.' : null,
    hasSavings: draft.hasSavings === null ? 'Responda se possui dinheiro guardado.' : null,
    savings:
      draft.hasSavings === 'sim' && (draft.savings === null || draft.savings <= 0) ? 'Informe quanto você tem guardado.' : null,
    value: valueCheck.ok
      ? null
      : valueCheck.reason === 'empty'
        ? `Informe o valor do ${obj.noun}.`
        : `O simulador calcula valores ${range.toLowerCase()}.`,
    name: validateName(firstName(draft.name)),
    phone: validatePhoneBR(draft.phone),
  };

  const missing = [
    errors.income && 'renda mensal',
    errors.hasSavings && 'dinheiro guardado',
    errors.savings && 'quanto tem guardado',
    errors.value && `valor do ${obj.noun}`,
    errors.name && 'primeiro nome',
    errors.phone && 'telefone',
  ].filter(Boolean) as string[];
  const ready = missing.length === 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || sending || draft.income === null || draft.value === null) return;
    setSending(true);
    await onSubmit({
      objective: draft.objective,
      valueReais: draft.value,
      profile: {
        incomeReais: draft.income,
        hasSavings: draft.hasSavings === 'sim',
        savingsReais: draft.hasSavings === 'sim' ? draft.savings : null,
      },
      contact: { name: firstName(draft.name), whatsapp: toE164BR(draft.phone) },
      honeypot: draft.honeypot,
    });
    setSending(false);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col">
      <h2 className="font-display text-[1.45rem] font-semibold leading-tight tracking-[-0.02em]">Simule em menos de um minuto</h2>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-offwhite/60">Veja na hora a parcela para o seu {obj.noun}.</p>

      <div className="mt-6 space-y-5">
        <ChoiceGroup
          legend="O que você quer conquistar"
          columns={2}
          value={draft.objective}
          onChange={(objective) => onChange({ objective })}
          options={OBJECTIVE_ORDER.map((id) => ({ value: id, label: OBJECTIVES[id].label }))}
        />

        <MoneyField
          name="income"
          label="Renda mensal"
          placeholder="5.000"
          suffix="por mês"
          value={draft.income}
          onChange={(income) => onChange({ income })}
          onBlur={touch('income')}
          error={touched.income ? errors.income : null}
        />

        <div>
          <ChoiceGroup
            legend="Possui dinheiro guardado?"
            columns={2}
            value={draft.hasSavings}
            onChange={(hasSavings) => onChange({ hasSavings })}
            options={[
              { value: 'sim', label: 'Sim' },
              { value: 'nao', label: 'Não' },
            ]}
          />
          {draft.hasSavings === 'sim' && (
            <div className="mt-4 animate-reveal-panel">
              <MoneyField
                name="savings"
                label="Quanto você tem guardado?"
                placeholder="20.000"
                value={draft.savings}
                onChange={(savings) => onChange({ savings })}
                onBlur={touch('savings')}
                error={touched.savings ? errors.savings : null}
              />
            </div>
          )}
        </div>

        <MoneyField
          name="value"
          label={`Qual o valor do ${obj.noun} que você deseja?`}
          placeholder={draft.objective === 'imovel' ? '300.000' : '60.000'}
          value={draft.value}
          onChange={(value) => onChange({ value })}
          onBlur={touch('value')}
          hint={range}
          // Fora da faixa avisa na hora; vazio só depois de sair do campo.
          error={draft.value !== null || touched.value ? errors.value : null}
        />

        <TextField
          label="Primeiro nome"
          name="name"
          type="text"
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Como podemos te chamar?"
          maxLength={40}
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          onBlur={touch('name')}
          error={touched.name ? errors.name : null}
        />

        <TextField
          label="Número de telefone (WhatsApp)"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          enterKeyHint="go"
          placeholder="(00) 00000-0000"
          value={draft.phone}
          onChange={(e) => onChange({ phone: maskPhoneBR(e.target.value) })}
          onBlur={touch('phone')}
          error={touched.phone ? errors.phone : null}
          className="tabular"
        />

        {/* Campo isca anti-spam: invisível para pessoas */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Não preencha
            <input tabIndex={-1} autoComplete="off" value={draft.honeypot} onChange={(e) => onChange({ honeypot: e.target.value })} />
          </label>
        </div>
      </div>

      <Button type="submit" className="mt-7" fullWidth disabled={!ready || sending} loading={sending} aria-describedby="form-pendente">
        {sending ? 'Calculando…' : 'Ver meu resultado'}
      </Button>
      <p id="form-pendente" aria-live="polite" className="mt-3 min-h-5 text-center text-[0.8rem] text-offwhite/50">
        {ready ? '' : `Falta informar: ${listPt(missing)}.`}
      </p>

      <p className="text-[0.8rem] leading-relaxed text-offwhite/50">
        Usamos seus dados apenas para falar com você sobre esta simulação.{' '}
        <button
          type="button"
          onClick={openPrivacy}
          className="inline-flex min-h-11 items-center align-middle font-semibold text-champagne underline decoration-champagne/40 underline-offset-2 hover:decoration-champagne"
        >
          Aviso de privacidade
        </button>
      </p>
      {!isLeadApiConfigured && <p className="text-[0.75rem] font-semibold text-champagne/80">Modo demonstração: nenhum dado é enviado.</p>}
    </form>
  );
}
