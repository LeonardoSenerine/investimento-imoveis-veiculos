/**
 * Camada de rastreamento: Google Tag Manager (dataLayer) e Meta Pixel.
 *
 * Regras:
 * - Os scripts só são carregados se os IDs estiverem configurados.
 * - `lead_form_submitted` deve ser disparado SOMENTE após confirmação do backend.
 * - Nenhum dado pessoal (nome, telefone) é enviado para as ferramentas.
 */
import { SITE } from '../config/site';
import { getUtmParams } from './attribution';

export type TrackingEvent =
  | 'page_view'
  | 'simulation_started'
  | 'simulation_completed'
  | 'lead_form_submitted'
  | 'whatsapp_clicked';

type Params = Record<string, string | number | boolean | undefined>;

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: Fbq;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const META_EVENTS: Record<TrackingEvent, { name: string; custom: boolean }> = {
  page_view: { name: 'PageView', custom: false },
  simulation_started: { name: 'SimulationStarted', custom: true },
  simulation_completed: { name: 'SimulationCompleted', custom: true },
  lead_form_submitted: { name: 'Lead', custom: false },
  whatsapp_clicked: { name: 'Contact', custom: false },
};

let initialized = false;
let pageViewSent = false;

function loadGtm(id: string) {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

function loadMetaPixel(id: string) {
  if (window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  fbq('init', id);
}

export function initTracking() {
  if (initialized) return;
  initialized = true;
  window.dataLayer = window.dataLayer ?? [];
  if (SITE.gtmId) loadGtm(SITE.gtmId);
  if (SITE.metaPixelId) loadMetaPixel(SITE.metaPixelId);
}

export function track(event: TrackingEvent, params: Params = {}) {
  if (event === 'page_view') {
    if (pageViewSent) return; // evita duplicidade (StrictMode / re-render)
    pageViewSent = true;
  }

  const payload = { ...getUtmParams(), ...params };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...payload });

  if (window.fbq) {
    const meta = META_EVENTS[event];
    window.fbq(meta.custom ? 'trackCustom' : 'track', meta.name, payload);
  }

  if (import.meta.env.DEV) {
    console.info(`[tracking] ${event}`, payload);
  }
}
