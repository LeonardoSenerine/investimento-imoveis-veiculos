import { useRef, useState, type FormEvent } from 'react';
import { PLANS } from '../../config/simulators';
import { isLeadApiConfigured } from '../../config/site';
import { formatReais } from '../../lib/money';
import { maskPhoneBR, toE164BR, validateName, validatePhoneBR } from '../../lib/validation';
import type { Contact } from '../../types';
import { usePrivacy } from '../privacy/PrivacyContext';
import { Button } from '../ui/Button';
import { TextField } from './fields';
import type { ValuesDraft } from './ValuesStep';

export interface ContactDraft {
  name: string;
  phone: string;
  honeypot: string;
}

export const initialContact = (): ContactDraft => ({ name: '', phone: '', honeypot: '' });

interface Props {
  values: ValuesDraft;
  contact: ContactDraft;
  onChange: (patch: Partial<ContactDraft>) => void;
  onBack: () => void;
  /** Simula e envia o lead; resolve quando a página de resultado pode abrir. */
  onSimulate: (contact: Contact, honeypot: string) => Promise<void>;
}

/** Passo 2: nome e celular. O botão Simular só libera com os dois válidos. */
export function ContactStep({ values, contact, onChange, onBack, onSimulate }: Props) {
  const { openPrivacy } = usePrivacy();
  const [touched, setTouched] = useState({ name: false, phone: false });
  const [sending, setSending] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const errors = { name: validateName(contact.name), phone: validatePhoneBR(contact.phone) };
  const ready = !errors.name && !errors.phone;
  const missing = errors.name && errors.phone ? 'Falta informar seu nome e celular.' : errors.name ? 'Falta informar seu nome.' : 'Falta informar um celular válido com DDD.';
  const plan = PLANS[values.planId];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    await onSimulate(
      { name: contact.name.trim().replace(/\s+/g, ' '), whatsapp: toE164BR(contact.phone) },
      contact.honeypot,
    );
    setSending(false);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col">
      <h2 className="font-display text-[1.45rem] font-semibold leading-tight tracking-[-0.02em]">Agora, seu contato</h2>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-offwhite/60">Seu resultado aparece logo em seguida.</p>

      {/* Resumo do passo 1, com volta rápida */}
      <div className="mt-5 flex items-center justify-between gap-3 rounded-md bg-charcoal/60 px-4 py-2 text-sm">
        <span className="tabular text-offwhite/75">
          {plan.label}: R$ {formatReais(values.monthly ?? 0)} por mês, crédito de R$ {formatReais(values.credit ?? 0)} em{' '}
          {values.term} meses
        </span>
        <button
          type="button"
          onClick={onBack}
          className="link-draw inline-flex min-h-11 shrink-0 items-center font-semibold text-champagne"
        >
          Alterar
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <TextField
          inputRef={nameRef}
          label="Nome"
          name="name"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Como podemos te chamar?"
          maxLength={80}
          value={contact.name}
          onChange={(e) => onChange({ name: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          error={touched.name ? errors.name : null}
        />
        <TextField
          label="Celular com WhatsApp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          enterKeyHint="go"
          placeholder="(00) 00000-0000"
          value={contact.phone}
          onChange={(e) => onChange({ phone: maskPhoneBR(e.target.value) })}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          error={touched.phone ? errors.phone : null}
          className="tabular"
        />
        {/* Campo isca anti-spam: invisível para pessoas */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Não preencha
            <input tabIndex={-1} autoComplete="off" value={contact.honeypot} onChange={(e) => onChange({ honeypot: e.target.value })} />
          </label>
        </div>
      </div>

      <Button type="submit" className="mt-7" fullWidth disabled={!ready || sending} loading={sending} aria-describedby="contato-pendente">
        {sending ? 'Simulando…' : 'Simular'}
      </Button>
      <p id="contato-pendente" aria-live="polite" className="mt-3 min-h-5 text-center text-[0.8rem] text-offwhite/50">
        {ready ? '' : missing}
      </p>

      <p className="text-[0.8rem] leading-relaxed text-offwhite/50">
        Usamos seu nome e celular apenas para falar com você sobre esta simulação.{' '}
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
