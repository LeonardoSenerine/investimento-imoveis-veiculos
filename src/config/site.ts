/**
 * Configuração do site lida das variáveis de ambiente (ver .env.example).
 * Tudo aqui é público: não coloque segredos em variáveis VITE_*.
 */
const env = import.meta.env;

const digits = (value: string | undefined) => (value ?? '').replace(/\D/g, '');

export const SITE = {
  /**
   * Marca pessoal do consultor (proposta: "Chave", o momento de receber a chave
   * da casa ou do carro). Troque aqui para alterar em todo o site.
   */
  descriptor: 'Chave',
  descriptorDetail: 'Planejamento de conquistas',
  /** WhatsApp do consultor (pode ser trocado por VITE_WHATSAPP_NUMBER). */
  whatsappNumber: digits(env.VITE_WHATSAPP_NUMBER) || '5511963329968',
  leadApiUrl: (env.VITE_LEAD_API_URL ?? '').trim(),
  gtmId: (env.VITE_GTM_ID ?? '').trim(),
  metaPixelId: digits(env.VITE_META_PIXEL_ID),
  privacyEmail: (env.VITE_PRIVACY_EMAIL ?? '').trim(),
  privacyNoticeVersion: '2026-11-09',
  defaultWhatsAppMessage:
    'Olá! Vim pelo site e quero planejar a compra de um imóvel ou veículo.',
} as const;

export const isLeadApiConfigured = SITE.leadApiUrl.length > 0;
export const isWhatsAppConfigured = SITE.whatsappNumber.length >= 12;
