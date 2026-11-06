/**
 * Captura e preserva a origem da campanha (UTMs e click IDs) durante a sessão.
 * Usa sessionStorage apenas para parâmetros de campanha — nunca dados pessoais.
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid'] as const;
const STORAGE_KEY = 'lp_attribution_v1';

export type UtmKey = (typeof UTM_KEYS)[number];
export type ClickIdKey = (typeof CLICK_ID_KEYS)[number];

export interface Attribution extends Partial<Record<UtmKey | ClickIdKey, string>> {
  landing_page: string;
  referrer: string;
  captured_at: string;
}

let memory: Attribution | null = null;

function readStored(): Attribution | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

function store(value: Attribution) {
  memory = value;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* armazenamento indisponível: mantém em memória */
  }
}

/**
 * Chamar uma vez no carregamento. Se a URL trouxer parâmetros de campanha,
 * eles substituem os anteriores (último toque da sessão). Caso contrário,
 * mantém a origem já capturada.
 */
export function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Partial<Record<UtmKey | ClickIdKey, string>> = {};
  for (const key of [...UTM_KEYS, ...CLICK_ID_KEYS]) {
    const value = params.get(key)?.trim();
    if (value) fromUrl[key] = value.slice(0, 200);
  }

  const existing = memory ?? readStored();
  if (Object.keys(fromUrl).length === 0 && existing) {
    memory = existing;
    return existing;
  }

  const attribution: Attribution = {
    ...fromUrl,
    landing_page: window.location.origin + window.location.pathname + window.location.search,
    referrer: document.referrer || '',
    captured_at: new Date().toISOString(),
  };
  store(attribution);
  return attribution;
}

export function getAttribution(): Attribution {
  return memory ?? readStored() ?? captureAttribution();
}

export function getUtmParams(): Partial<Record<UtmKey, string>> {
  const a = getAttribution();
  return Object.fromEntries(UTM_KEYS.filter((k) => a[k]).map((k) => [k, a[k]]));
}
