# Landing page — Consórcios (Imóveis · Veículos)

Landing page de conversão para tráfego pago (Meta Ads / Google Ads).
React + TypeScript + Vite + Tailwind CSS 4 + GSAP (ScrollTrigger) + Lucide.

## Rodar

```bash
npm install
cp .env.example .env   # preencha as variáveis
npm run dev            # http://localhost:5173
npm test               # testes das fórmulas
npm run build          # gera /dist
```

## Antes de publicar — checklist

| Item | Onde | Situação |
| --- | --- | --- |
| Validar fatores, prazos e faixas de crédito | `src/config/simulators.ts` | **Preliminar** (dados do cliente) |
| Regra para créditos de R$ 30 mil a R$ 35 mil | `UNVALIDATED_VEHICLE_RANGE` | Sem regra: exibe atendimento |
| Conectar API de cadastro | `VITE_LEAD_API_URL` | Sem ela, roda em **modo demonstração** |
| Número do WhatsApp | `VITE_WHATSAPP_NUMBER` | Sem ele, o link abre o WhatsApp sem destinatário |
| GTM e/ou Meta Pixel | `VITE_GTM_ID`, `VITE_META_PIXEL_ID` | Carregados só se configurados |
| Revisão jurídica do aviso de privacidade (LGPD) | `src/components/privacy/PrivacyNotice.tsx` | Modelo-base |
| Banner de consentimento de cookies (se usar Pixel/GTM) | — | Recomendado, não implementado |
| Hospedar imagens no próprio CDN (opcional) | `src/config/images.ts` | Usa CDN Unsplash otimizado |

Enquanto a API ou o WhatsApp não estiverem configurados, o rodapé e o formulário mostram o selo **Modo demonstração**.

## Arquitetura

```
src/
  motion/        gsap.ts (registro/config) · useMotion.ts (escopo + limpeza)
                 useScrollReveals.ts (reveals declarativos por data-attribute)
  config/        simulators.ts (regras e faixas) · site.ts (env) · images.ts
  lib/           money.ts (BigInt, centavos) · calculator.ts · validation.ts
                 tracking.ts (GTM/Pixel) · attribution.ts (UTMs) · whatsapp.ts
  services/      leadService.ts (integração com backend)
  content/       faq.ts
  components/    Header · Hero · GoalSelector · HowItWorks · FAQ · FinalCTA
                 LeadCaptureForm · WhatsAppButton · Footer
    simulator/   SimulatorSection · PropertySimulator · VehicleSimulator
                 CreditInput · SimulationResult
    privacy/     PrivacyNotice · PrivacyContext
                 PlanSelector
    ui/          Button · StockImage · Type (Lines, Words, Label)
```

### Cálculo

`parcela = (crédito × fator) ÷ prazo`, calculada em **centavos com BigInt** e arredondamento half-up.
Nenhum número de regra fica fora de `config/simulators.ts`. Exemplos do cliente cobertos por teste:

- Imóvel R$ 500.000 → **R$ 2.822,73** (220 meses)
- Moto R$ 20.000 → **R$ 427,33** (60 meses)
- Automóvel R$ 100.000 → **R$ 1.291,11** (90 meses)

### Jornada

1. Hero → CTA leva direto ao simulador.
2. Cards de objetivo pré-selecionam a categoria (e o tipo de veículo).
3. Campo monetário + slider sincronizados; resultado instantâneo.
4. O cadastro só aparece **depois** da simulação (ao parar de ajustar ou ao clicar em “Gostei, quero continuar”).
5. Após o envio confirmado: confirmação + WhatsApp com mensagem contextualizada.

### Rastreamento

Eventos enviados para `window.dataLayer` (e `fbq`, se o Pixel estiver configurado), sempre com as UTMs da sessão:

| Evento | Quando | Meta Pixel |
| --- | --- | --- |
| `page_view` | carregamento (uma vez) | `PageView` |
| `simulation_started` | 1ª interação com o simulador | `SimulationStarted` (custom) |
| `simulation_completed` | resultado válido estável por 1,2 s ou clique em continuar (sem duplicar o mesmo valor) | `SimulationCompleted` (custom) |
| `lead_form_submitted` | **somente** após resposta 2xx da API | `Lead` |
| `whatsapp_clicked` | qualquer botão de WhatsApp (`location` indica qual) | `Contact` |

Nome e telefone **nunca** são enviados para GTM/Pixel. As UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) e click IDs (`gclid`, `fbclid`…) ficam em `sessionStorage` e seguem junto com o cadastro.
Use GTM **ou** Pixel direto — não os dois para o mesmo Pixel, para não duplicar eventos.

### Backend

Contrato em [docs/api-contract.md](docs/api-contract.md) e tabela sugerida em [docs/schema.sql](docs/schema.sql).
Nenhum dado pessoal é salvo no navegador.

## Motion

GSAP + ScrollTrigger sobre a rolagem nativa (sem smooth-scroll, sem scroll hijacking, sem pin).

| Onde | Efeito | Mobile |
| --- | --- | --- |
| Hero | foto abre por clip-path + escala; título sobe por linhas; deck entra em sequência; na rolagem a foto desce mais devagar que o texto | clip menor, parallax reduzido |
| Manifesto (Objetivos) | palavras acendem no ritmo da leitura (`data-reveal="words"`, scrub) | igual |
| Fotos dos capítulos | máscara clip-path + desaceleração de escala; parallax interno | amplitude 50% |
| Títulos de seção | line reveal (`data-reveal="lines"`) — só nos pontos de maior impacto | igual |
| Simulador | folha off-white se abre lateralmente ao entrar; parcela com interpolação numérica (valor final sempre exato) | sem a folha |
| Como funciona | trilho de cobre preenche com a leitura; etapa ativa acende | igual |
| CTA final | moldura se expande até a tela cheia | inset menor |

Regras: tudo via `gsap.matchMedia` → com `prefers-reduced-motion: reduce` **nada é registrado** e o conteúdo fica estático no estado final. Apenas `transform`, `opacity` e `clip-path` são animados. ScrollTriggers são revertidos no unmount e recalculados quando a altura da página muda (formulário revelado, accordion). Dispositivos com ≤ 2 núcleos não recebem parallax.
Em desenvolvimento, `window.__gsap` e `window.__ScrollTrigger` ficam expostos para inspeção (removidos no build).

## Direção de arte

- Paleta: carvão `#151515`, grafite `#292725`, cobre `#B87943`, champagne `#D9A66F`, off-white `#F3F0EA`, madeira `#806047` (tokens em `src/index.css`).
- Tipografia: Archivo, uma família com largura variável. Títulos na versão expandida (118%), texto corrido na largura normal. Contraste de largura em vez de duas fontes.
- Textos pequenos sobre off-white usam madeira (contraste AA); o cobre fica para elementos grandes e detalhes.
- Fotos: Unsplash (licença permite uso comercial), selecionadas por luz quente/noturna.
- Cantos vivos (2px) e fios finos no lugar de cards arredondados. Numeração só onde há sequência real (as etapas).
- Sem rótulos em caixa alta acima dos títulos, sem palavra destacada em cor nos títulos e sem travessões no texto.
- Botão arquitetônico: rótulo + célula de seta separada por fio; no hover, lâmina de cor varre da esquerda e a seta é substituída.
