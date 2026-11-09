# Contrato da API de leads

`POST {VITE_LEAD_API_URL}` · `Content-Type: application/json`

O formulário tem uma etapa só. O site envia **uma requisição** ao clicar em "Ver meu resultado", com o
objetivo, o valor, a renda, o dinheiro guardado, o contato e as parcelas calculadas. Se a API não
confirmar, o mesmo envio é repetido quando a pessoa clica no WhatsApp. O servidor deve fazer
**upsert pelo celular** e guardar cada simulação separada.

```json
{
  "lead_id": null,
  "name": "Marcos",
  "whatsapp": "5511987651234",
  "profile": {
    "monthly_income": "8000.00",
    "has_savings": true,
    "savings_amount": "20000.00"
  },
  "simulation": {
    "objective": "imovel",
    "objective_label": "Imóvel",
    "desired_value": "200000.00",
    "rule": "imovel",
    "term_months": 220,
    "full_installment": "1127.27",
    "reduced_installment": "854.54",
    "reduced_percent": 70,
    "simulated_at": "2026-11-09T18:21:05.000Z",
    "rules_status": "preliminar"
  },
  "attribution": {
    "utm_source": "meta",
    "utm_medium": "paid",
    "utm_campaign": "lancamento",
    "landing_page": "https://investimento-imoveis-veiculos.vercel.app/?utm_source=meta",
    "referrer": "https://l.facebook.com/",
    "captured_at": "2026-11-09T18:19:02.000Z"
  },
  "consent": {
    "purpose": "Contato sobre a simulação realizada e envio de informações sobre o planejamento da compra.",
    "privacy_notice_version": "2026-11-09",
    "accepted_at": "2026-11-09T18:21:05.000Z"
  },
  "meta": { "page_url": "https://…", "submitted_at": "2026-11-09T18:21:05.000Z", "hp": "" }
}
```

| Campo | Significado |
| --- | --- |
| `profile.monthly_income` | Renda mensal informada |
| `profile.has_savings` / `savings_amount` | Se possui dinheiro guardado e quanto (`null` quando não) |
| `simulation.desired_value` | Valor do imóvel ou veículo desejado |
| `simulation.rule` | `imovel` (fator 1,24, 220 meses, reduzida 70%), `veiculo` (a partir de R$ 30 mil: 1,162, 90 meses, reduzida 50%) ou `veiculo_ate_30k` (1,282, 60 meses, só parcela cheia) |
| `full_installment` | (valor × fator) ÷ prazo |
| `reduced_installment` | (valor ÷ prazo) × percentual + (valor × (fator − 1)) ÷ prazo; `null` em `veiculo_ate_30k` |

Valores monetários chegam como **string decimal** (nunca float). Grave como `numeric(14,2)`.
As regras ficam em `src/config/simulators.ts`. Tabelas sugeridas em [schema.sql](schema.sql).

## Respostas

| Status | Corpo | Front-end |
| --- | --- | --- |
| `201`/`200` | `{ "id": "uuid" }` | Evento `lead_form_submitted` |
| `4xx` / `5xx` / timeout 12 s | — | O resultado abre mesmo assim (espera no máximo 4 s); o envio é repetido ao clicar no WhatsApp |

## Recomendações para o servidor

- Revalidar tudo (nome 2 a 40 caracteres; celular `^55\d{10,11}$`).
- **Recalcular as parcelas no servidor** com as mesmas regras; não confiar no valor do cliente.
- Descartar silenciosamente (responder 201) quando `meta.hp` vier preenchido (bot).
- Rate limit por IP; CORS restrito ao domínio do site.
