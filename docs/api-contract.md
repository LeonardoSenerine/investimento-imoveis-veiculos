# Contrato da API de leads

`POST {VITE_LEAD_API_URL}` · `Content-Type: application/json`

O formulário tem dois passos (1: objetivo, quanto guarda por mês, crédito e prazo; 2: nome e celular). Nada é enviado no passo 1. O site envia:

1. `stage: "simulation"`: **uma requisição** ao clicar em Simular, com valores, contato e zona de calor juntos.
2. `stage: "update"`: só quando a pessoa ajusta o cenário na página de resultado (ou o envio 1 não foi confirmado) e clica para conversar no WhatsApp. Vai com `lead_id` (se a API devolveu um) e sempre com o celular.

O servidor deve fazer **upsert pelo celular** e guardar cada simulação separada.

## Simular

```json
{
  "stage": "simulation",
  "lead_id": null,
  "name": "Marcos Teixeira",
  "whatsapp": "5511987651234",
  "simulation": {
    "plan_id": "automovel",
    "plan_label": "Carro",
    "monthly_savings": "1000.00",
    "credit_needed": "100000.00",
    "term_months": 90,
    "reference_installment": "1291.11",
    "fits": false,
    "heat_zone": "morno",
    "ratio": 0.775,
    "simulated_at": "2026-11-08T18:21:05.000Z",
    "rules_status": "preliminar"
  },
  "attribution": {
    "utm_source": "meta",
    "utm_medium": "paid",
    "utm_campaign": "lancamento",
    "landing_page": "https://investimento-imoveis-veiculos.vercel.app/?utm_source=meta",
    "referrer": "https://l.facebook.com/",
    "captured_at": "2026-11-08T18:19:02.000Z"
  },
  "consent": {
    "purpose": "Contato sobre a simulação realizada e envio de informações sobre o planejamento da compra.",
    "privacy_notice_version": "2026-11-06",
    "accepted_at": "2026-11-08T18:21:05.000Z"
  },
  "meta": { "page_url": "https://…", "submitted_at": "2026-11-08T18:21:05.000Z", "hp": "" }
}
```

O `update` tem o mesmo formato, com `"stage": "update"` e o cenário ajustado em `simulation`.

| Campo | Significado |
| --- | --- |
| `monthly_savings` | Quanto a pessoa consegue guardar por mês |
| `credit_needed` | De quanto crédito ela precisa |
| `reference_installment` | (crédito × fator) ÷ prazo, pela regra do cliente |
| `ratio` | `monthly_savings ÷ reference_installment` |
| `heat_zone` | `quente` (ratio ≥ 1, cabe), `morno` (0,75 a 0,99), `frio` (abaixo de 0,75) |

Valores monetários chegam como **string decimal** (nunca float). Grave como `numeric(14,2)`.
Os limites das zonas ficam em `src/config/simulators.ts` (`HEAT`). Tabelas sugeridas em [schema.sql](schema.sql).

## Respostas

| Status | Corpo | Front-end |
| --- | --- | --- |
| `201`/`200` | `{ "id": "uuid" }` | No `simulation`: evento `lead_form_submitted` |
| `4xx` / `5xx` / timeout 12 s | — | O resultado abre mesmo assim (espera no máximo 4 s); o lead é reenviado como `update` ao clicar no WhatsApp |

## Recomendações para o servidor

- Revalidar tudo (nome 2 a 80 caracteres; celular `^55\d{10,11}$`).
- **Recalcular a parcela e a zona no servidor** com a mesma configuração; não confiar no valor do cliente.
- Descartar silenciosamente (responder 201) quando `meta.hp` vier preenchido (bot).
- Rate limit por IP; CORS restrito ao domínio do site.
