-- Tabelas sugeridas (PostgreSQL 14+) para os cadastros do site.
-- Um lead por celular (upsert); cada envio vira uma linha em simulations.

CREATE TABLE IF NOT EXISTS leads (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  name                   text        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
  whatsapp               text        NOT NULL UNIQUE CHECK (whatsapp ~ '^55[0-9]{10,11}$'),

  -- Situação informada na simulação mais recente
  monthly_income         numeric(14,2),
  has_savings            boolean,
  savings_amount         numeric(14,2),

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

  objective              text        NOT NULL CHECK (objective IN ('imovel', 'veiculo')),
  rule                   text        NOT NULL CHECK (rule IN ('imovel', 'veiculo', 'veiculo_ate_30k')),
  desired_value          numeric(14,2) NOT NULL CHECK (desired_value > 0),
  term_months            smallint    NOT NULL CHECK (term_months > 0),
  full_installment       numeric(14,2) NOT NULL,
  reduced_installment    numeric(14,2),
  reduced_percent        smallint,
  monthly_income         numeric(14,2) NOT NULL,
  has_savings            boolean     NOT NULL,
  savings_amount         numeric(14,2),
  rules_status           text        NOT NULL DEFAULT 'preliminar',
  simulated_at           timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx   ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_campaign_idx     ON leads (utm_source, utm_campaign);
CREATE INDEX IF NOT EXISTS simulations_lead_idx   ON simulations (lead_id, created_at DESC);
