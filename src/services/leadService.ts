/**
 * Integração com o backend de leads.
 *
 * Contrato esperado (ver docs/api-contract.md):
 *   POST {VITE_LEAD_API_URL}
 *   Content-Type: application/json
 *   → 2xx { "id": "..." }  sucesso confirmado
 *   → 4xx/5xx               erro
 *
 * Sem URL configurada, retorna `demo` — nada é enviado e nenhum evento de
 * conversão deve ser disparado.
 */
import { SITE, isLeadApiConfigured } from '../config/site';
import type { Attribution } from '../lib/attribution';
import { centsToDecimalString } from '../lib/money';
import type { SimulationSnapshot } from '../types';

export interface LeadInput {
  name: string;
  whatsapp: string; // E.164 sem "+", ex.: 5511912345678
  simulation: SimulationSnapshot;
  attribution: Attribution;
  /** Campo isca anti-spam: deve chegar vazio. */
  honeypot: string;
}

export interface LeadPayload {
  name: string;
  whatsapp: string;
  simulation: {
    plan_id: string;
    plan_label: string;
    category: string;
    credit_amount: string;
    term_months: number;
    estimated_installment: string;
    simulated_at: string;
    rules_status: 'preliminar';
  };
  attribution: Attribution;
  consent: {
    purpose: string;
    privacy_notice_version: string;
    accepted_at: string;
  };
  meta: {
    page_url: string;
    submitted_at: string;
    hp: string;
  };
}

export type SubmitResult =
  | { status: 'success'; leadId?: string }
  | { status: 'demo'; payload: LeadPayload }
  | { status: 'error'; message: string };

export const LEAD_PURPOSE =
  'Contato sobre a simulação realizada e envio de informações sobre consórcio.';

export function buildLeadPayload(input: LeadInput): LeadPayload {
  const now = new Date().toISOString();
  const s = input.simulation;
  return {
    name: input.name.trim().replace(/\s+/g, ' '),
    whatsapp: input.whatsapp,
    simulation: {
      plan_id: s.planId,
      plan_label: s.planLabel,
      category: s.category,
      credit_amount: centsToDecimalString(s.creditCents),
      term_months: s.termMonths,
      estimated_installment: centsToDecimalString(s.installmentCents),
      simulated_at: s.simulatedAt,
      rules_status: 'preliminar',
    },
    attribution: input.attribution,
    consent: {
      purpose: LEAD_PURPOSE,
      privacy_notice_version: SITE.privacyNoticeVersion,
      accepted_at: now,
    },
    meta: {
      page_url: window.location.href,
      submitted_at: now,
      hp: input.honeypot,
    },
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
