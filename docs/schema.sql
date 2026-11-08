-- Tabelas sugeridas (PostgreSQL 14+) para os cadastros do site.
-- Um lead por celular (upsert); cada envio (simulation ou update) vira uma linha em simulations.

CREATE TABLE IF NOT EXISTS leads (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  name                   text        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  whatsapp               text        NOT NULL UNIQUE CHECK (whatsapp ~ '^55[0-9]{10,11}$'),

  -- Zona de calor da simulação mais recente (para priorizar o atendimento)
  last_heat_zone         text CHECK (last_heat_zone IN ('quente', 'morno', 'frio')),

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

CREATE TABLE IF NOT EXISTS simulations (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                uuid        NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  created_at             timestamptz NOT NULL DEFAULT now(),

  plan_id                text        NOT NULL CHECK (plan_id IN ('imovel', 'automovel', 'moto')),
  monthly_savings        numeric(14,2) NOT NULL CHECK (monthly_savings > 0),
  credit_needed          numeric(14,2) NOT NULL CHECK (credit_needed > 0),
  term_months            smallint    NOT NULL CHECK (term_months > 0),
  reference_installment  numeric(14,2) NOT NULL,
  fits                   boolean     NOT NULL,
  heat_zone              text        NOT NULL CHECK (heat_zone IN ('quente', 'morno', 'frio')),
  ratio                  numeric(8,3) NOT NULL,
  stage                  text        NOT NULL DEFAULT 'simulation' CHECK (stage IN ('simulation', 'update')),
  rules_status           text        NOT NULL DEFAULT 'preliminar',
  simulated_at           timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx   ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_campaign_idx     ON leads (utm_source, utm_campaign);
CREATE INDEX IF NOT EXISTS leads_heat_idx         ON leads (last_heat_zone, updated_at DESC);
CREATE INDEX IF NOT EXISTS simulations_lead_idx   ON simulations (lead_id, created_at DESC);
