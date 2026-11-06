/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_LEAD_API_URL?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_GTM_ID?: string;
  readonly VITE_META_PIXEL_ID?: string;
  readonly VITE_PRIVACY_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
