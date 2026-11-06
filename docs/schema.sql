-- Tabela sugerida (PostgreSQL 14+) para os cadastros da landing page.

CREATE TABLE IF NOT EXISTS leads (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at             timestamptz NOT NULL DEFAULT now(),

  name                   text        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  whatsapp               text        NOT NULL CHECK (whatsapp ~ '^55[0-9]{10,11}$'),

  plan_id                text        NOT NULL CHECK (plan_id IN ('imovel', 'automovel', 'moto')),
  category               text        NOT NULL CHECK (category IN ('property', 'vehicle')),
  monthly_budget         numeric(14,2) NOT NULL CHECK (monthly_budget > 0),
  credit_amount          numeric(14,2) NOT NULL CHECK (credit_amount > 0),
  term_months            smallint    NOT NULL CHECK (term_months > 0),
  estimated_installment  numeric(14,2) NOT NULL,
  rules_status           text        NOT NULL DEFAULT 'preliminar',
  simulated_at           timestamptz NOT NULL,

  timeframe              text CHECK (timeframe IN ('asap', 'within_1y', 'planning')),
  savings                text CHECK (savings IN ('yes', 'no', 'talk')),
  purchase_type          text CHECK (purchase_type IN ('first', 'upgrade', 'investment')),
  best_time              text CHECK (best_time IN ('morning', 'afternoon', 'evening')),
  lead_score             smallint,
  lead_temperature       text CHECK (lead_temperature IN ('quente', 'morno', 'frio')),

  utm_source             text,
  utm_medium             text,
  utm_campaign           text,
  utm_content            text,
  utm_term               text,
  click_ids              jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- gclid, fbclid, gbraid, wbraid
  landing_page           text,
  referrer               text,

  privacy_notice_version text        NOT NULL,
  consent_at             timestamptz NOT NULL,

  status                 text        NOT NULL DEFAULT 'novo'
                         CHECK (status IN ('novo', 'em_contato', 'proposta', 'convertido', 'descartado')),
  deleted_at             timestamptz            -- exclusão a pedido do titular (LGPD)
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_campaign_idx   ON leads (utm_source, utm_campaign);
CREATE INDEX IF NOT EXISTS leads_whatsapp_idx   ON leads (whatsapp);
CREATE INDEX IF NOT EXISTS leads_temperature_idx ON leads (lead_temperature, created_at DESC);
