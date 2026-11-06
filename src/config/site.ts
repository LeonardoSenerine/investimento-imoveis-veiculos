/**
 * Configuração do site lida das variáveis de ambiente (ver .env.example).
 * Tudo aqui é público: não coloque segredos em variáveis VITE_*.
 */
const env = import.meta.env;

const digits = (value: string | undefined) => (value ?? '').replace(/\D/g, '');

export const SITE = {
  /** Descritor textual exibido no cabeçalho (não é marca nem logotipo). */
  descriptor: 'Consórcios',
  descriptorDetail: 'Imóveis e veículos',
  whatsappNumber: digits(env.VITE_WHATSAPP_NUMBER),
  leadApiUrl: (env.VITE_LEAD_API_URL ?? '').trim(),
  gtmId: (env.VITE_GTM_ID ?? '').trim(),
  metaPixelId: digits(env.VITE_META_PIXEL_ID),
  privacyEmail: (env.VITE_PRIVACY_EMAIL ?? '').trim(),
  privacyNoticeVersion: '2026-11-06',
  defaultWhatsAppMessage:
    'Olá! Vim pelo site e gostaria de receber informações sobre consórcio.',
} as const;

export const isLeadApiConfigured = SITE.leadApiUrl.length > 0;
export const isWhatsAppConfigured = SITE.whatsappNumber.length >= 12;
