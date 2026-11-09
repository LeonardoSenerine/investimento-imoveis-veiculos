/**
 * Integração com o backend de leads: um envio ao clicar em "Ver meu resultado",
 * com objetivo, valor, renda, dinheiro guardado, contato e as parcelas.
 * Se o envio não foi confirmado, ele é repetido quando a pessoa clica no WhatsApp
 * (o servidor deve fazer upsert pelo celular).
 *
 * Contrato (ver docs/api-contract.md):
 *   POST {VITE_LEAD_API_URL}  Content-Type: application/json
 *   → 2xx { "id": "..." }  sucesso confirmado
 *   → 4xx/5xx               erro
 *
 * Sem URL configurada, retorna `demo`: nada é enviado e nenhum evento de
 * conversão deve ser disparado.
 */
import { OBJECTIVES, type Objective, type RuleId } from '../config/simulators';
import { SITE, isLeadApiConfigured } from '../config/site';
import type { Attribution } from '../lib/attribution';
import { centsToDecimalString } from '../lib/money';
import type { Contact, SimulationResult } from '../types';

export interface LeadInput {
  contact: Contact;
  result: SimulationResult;
  attribution: Attribution;
  /** Campo isca anti-spam: deve chegar vazio. */
  honeypot: string;
}

export interface LeadPayload {
  lead_id: string | null;
  name: string;
  whatsapp: string;
  profile: {
    monthly_income: string;
    has_savings: boolean;
    savings_amount: string | null;
  };
  simulation: {
    objective: Objective;
    objective_label: string;
    desired_value: string;
    rule: RuleId;
    term_months: number;
    full_installment: string;
    reduced_installment: string | null;
    reduced_percent: number | null;
    simulated_at: string;
    rules_status: 'preliminar';
  };
  attribution: Attribution;
  consent: { purpose: string; privacy_notice_version: string; accepted_at: string };
  meta: { page_url: string; submitted_at: string; hp: string };
}

export type SubmitResult =
  | { status: 'success'; leadId?: string }
  | { status: 'demo'; payload: LeadPayload }
  | { status: 'error'; message: string };

export const LEAD_PURPOSE = 'Contato sobre a simulação realizada e envio de informações sobre o planejamento da compra.';

const money = (reais: number) => `${reais}.00`;

export function buildLeadPayload({ contact, result, attribution, honeypot }: LeadInput): LeadPayload {
  const now = new Date().toISOString();
  const { quote: q, profile } = result;
  return {
    lead_id: contact.leadId ?? null,
    name: contact.name.trim().replace(/\s+/g, ' '),
    whatsapp: contact.whatsapp,
    profile: {
      monthly_income: money(profile.incomeReais),
      has_savings: profile.hasSavings,
      savings_amount: profile.hasSavings && profile.savingsReais ? money(profile.savingsReais) : null,
    },
    simulation: {
      objective: q.objective,
      objective_label: OBJECTIVES[q.objective].label,
      desired_value: money(q.valueReais),
      rule: q.rule.id,
      term_months: q.termMonths,
      full_installment: centsToDecimalString(q.fullCents),
      reduced_installment: q.reducedCents === null ? null : centsToDecimalString(q.reducedCents),
      reduced_percent: q.reducedPercent,
      simulated_at: result.simulatedAt,
      rules_status: 'preliminar',
    },
    attribution,
    consent: { purpose: LEAD_PURPOSE, privacy_notice_version: SITE.privacyNoticeVersion, accepted_at: now },
    meta: { page_url: window.location.href, submitted_at: now, hp: honeypot },
  };
}

const TIMEOUT_MS = 12_000;

export async function submitLead(input: LeadInput): Promise<SubmitResult> {
  const payload = buildLeadPayload(input);

  if (!isLeadApiConfigured) {
    if (import.meta.env.DEV) console.info('[lead] modo demonstração, payload:', payload);
    return { status: 'demo', payload };
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(SITE.leadApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        status: 'error',
        message:
          res.status >= 500
            ? 'Nosso sistema está instável no momento. Tente novamente em instantes.'
            : 'Não foi possível enviar seus dados. Verifique as informações e tente novamente.',
      };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { status: 'success', leadId: data.id };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    return {
      status: 'error',
      message: aborted
        ? 'A conexão demorou mais que o esperado. Tente novamente.'
        : 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
    };
  } finally {
    window.clearTimeout(timer);
  }
}
