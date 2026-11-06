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
    "credit_amount": "100000.00",
    "term_months": 90,
    "estimated_installment": "1291.11",
    "simulated_at": "2026-11-06T18:20:11.512Z",
    "rules_status": "preliminar"
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
