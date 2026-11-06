# Contrato da API de leads

`POST {VITE_LEAD_API_URL}` · `Content-Type: application/json`

## Corpo enviado pelo front-end

```json
{
  "name": "Mariana Souza",
  "whatsapp": "5511987654321",
  "simulation": {
    "plan_id": "automovel",
    "plan_label": "Automóvel",
    "category": "vehicle",
    "monthly_budget": "1300.00",
    "credit_amount": "100000.00",
    "term_months": 90,
    "estimated_installment": "1291.11",
    "simulated_at": "2026-11-06T18:20:11.512Z",
    "rules_status": "preliminar"
  },
  "qualification": {
    "timeframe": "asap",
    "savings": "yes",
    "purchase_type": "first",
    "best_time": "evening",
    "score": 5,
    "temperature": "quente"
  },
  "attribution": {
    "utm_source": "meta",
    "utm_medium": "paid",
    "utm_campaign": "lancamento",
    "utm_content": "video_01",
    "utm_term": "consorcio carro",
    "fbclid": "…",
    "landing_page": "https://exemplo.com.br/?utm_source=meta…",
    "referrer": "https://l.facebook.com/",
    "captured_at": "2026-11-06T18:19:02.000Z"
  },
  "consent": {
    "purpose": "Contato sobre a simulação realizada e envio de informações sobre consórcio.",
    "privacy_notice_version": "2026-11-06",
    "accepted_at": "2026-11-06T18:21:40.000Z"
  },
  "meta": {
    "page_url": "https://exemplo.com.br/?utm_source=meta…",
    "submitted_at": "2026-11-06T18:21:40.000Z",
    "hp": ""
  }
}
```

Valores monetários chegam como **string decimal** (nunca float). Grave como `numeric(14,2)`.

- `monthly_budget`: quanto a pessoa disse que pode investir por mês (entrada principal do simulador).
- `credit_amount`: crédito estimado pela fórmula inversa, arredondado para baixo.
- `estimated_installment`: parcela de referência desse crédito (sempre ≤ `monthly_budget`).

### Qualificação

| Campo | Valores |
| --- | --- |
| `timeframe` | `asap` (o quanto antes), `within_1y` (até 1 ano), `planning` (sem pressa) |
| `savings` | `yes`, `no`, `talk` (prefere conversar) |
| `purchase_type` | `first` (primeira aquisição), `upgrade` (troca), `investment` |
| `best_time` | `morning`, `afternoon`, `evening` |
| `temperature` | `quente` (score ≥ 4), `morno` (2 a 3), `frio` (0 a 1) |

Os pesos ficam em `src/config/qualification.ts`. Recalcule o score no servidor se for usá-lo para distribuição de leads.

## Respostas

| Status | Corpo | Front-end |
| --- | --- | --- |
| `201`/`200` | `{ "id": "uuid" }` | Confirmação + evento `lead_form_submitted` |
| `4xx` | qualquer | Mensagem “verifique as informações” |
| `5xx` / timeout 12 s | — | Mensagem de instabilidade, sem evento |

## Recomendações para o servidor

- Revalidar tudo (nome 2–80 caracteres; WhatsApp `^55\d{10,11}$`).
- **Recalcular a parcela no servidor** com a mesma configuração — não confiar no valor do cliente.
- Descartar silenciosamente (responder 201) quando `meta.hp` vier preenchido (bot).
- Rate limit por IP; CORS restrito ao domínio da landing.
- Registrar IP e user-agent no servidor apenas se previsto no aviso de privacidade.
