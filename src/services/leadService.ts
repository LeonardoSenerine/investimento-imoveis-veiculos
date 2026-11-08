/**
 * Integração com o backend de leads:
 *
 *  1. stage "simulation": envio único ao clicar em Simular, com valores,
 *     nome, celular e a zona de calor.
 *  2. stage "update": quando a pessoa ajusta o cenário na página de resultado
 *     e clica para conversar, atualiza o mesmo lead (`lead_id` e celular).
 *
 * Contrato (ver docs/api-contract.md):
 *   POST {VITE_LEAD_API_URL}  Content-Type: application/json
 *   → 2xx { "id": "..." }  sucesso confirmado
 *   → 4xx/5xx               erro
 *
 * Sem URL configurada, retorna `demo`: nada é enviado e nenhum evento de
 * conversão deve ser disparado.
 */
import { PLANS } from '../config/simulators';
import { SITE, isLeadApiConfigured } from '../config/site';
import type { Attribution } from '../lib/attribution';
import type { Feasibility, HeatZone } from '../lib/feasibility';
import { centsToDecimalString } from '../lib/money';
import type { Contact } from '../types';

export interface LeadInput {
  stage: 'simulation' | 'update';
  contact: Contact;
  simulation?: { feasibility: Feasibility; simulatedAt: string };
  attribution: Attribution;
  /** Campo isca anti-spam: deve chegar vazio. */
  honeypot: string;
}

export interface LeadPayload {
  stage: 'simulation' | 'update';
  lead_id: string | null;
  name: string;
  whatsapp: string;
  simulation: {
    plan_id: string;
    plan_label: string;
    monthly_savings: string;
    credit_needed: string;
    term_months: number;
    reference_installment: string;
    fits: boolean;
    heat_zone: HeatZone;
    ratio: number;
    simulated_at: string;
    rules_status: 'preliminar';
  } | null;
  attribution: Attribution;
  consent: { purpose: string; privacy_notice_version: string; accepted_at: string };
  meta: { page_url: string; submitted_at: string; hp: string };
}

export type SubmitResult =
  | { status: 'success'; leadId?: string }
  | { status: 'demo'; payload: LeadPayload }
  | { status: 'error'; message: string };

export const LEAD_PURPOSE = 'Contato sobre a simulação realizada e envio de informações sobre o planejamento da compra.';

export function buildLeadPayload(input: LeadInput): LeadPayload {
  const now = new Date().toISOString();
  const s = input.simulation;
  const f = s?.feasibility;
  return {
    stage: input.stage,
    lead_id: input.contact.leadId ?? null,
    name: input.contact.name.trim().replace(/\s+/g, ' '),
    whatsapp: input.contact.whatsapp,
    simulation:
      s && f
        ? {
            plan_id: f.request.planId,
            plan_label: PLANS[f.request.planId].label,
            monthly_savings: `${f.request.monthlyReais}.00`,
            credit_needed: `${f.request.creditReais}.00`,
            term_months: f.request.termMonths,
            reference_installment: centsToDecimalString(f.installmentCents),
            fits: f.fits,
            heat_zone: f.zone,
            ratio: Math.round(f.ratio * 1000) / 1000,
            simulated_at: s.simulatedAt,
            rules_status: 'preliminar',
          }
        : null,
    attribution: input.attribution,
    consent: { purpose: LEAD_PURPOSE, privacy_notice_version: SITE.privacyNoticeVersion, accepted_at: now },
    meta: { page_url: window.location.href, submitted_at: now, hp: input.honeypot },
  };
}

const TIMEOUT_MS = 12_000;

export async function submitLead(input: LeadInput): Promise<SubmitResult> {
  const payload = buildLeadPayload(input);

  if (!isLeadApiConfigured) {
    if (import.meta.env.DEV) console.info(`[lead] modo demonstração (${input.stage}), payload:`, payload);
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
