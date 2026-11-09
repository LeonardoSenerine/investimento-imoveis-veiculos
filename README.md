# Chave: simulação de imóvel, carro e moto

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
| Domínio público para a capa de link | `.env.production` (`VITE_SITE_URL`) | Configurado: investimento-imoveis-veiculos.vercel.app |

Enquanto a API ou o WhatsApp não estiverem configurados, o rodapé e o formulário mostram o aviso **Modo demonstração**.

O site não usa a palavra "consórcio" (pedido do cliente). Para manter a transparência, ele não fala em empréstimo, financiamento ou rendimento, e informa que valores, prazos e a forma de liberação do crédito são apresentados no atendimento, antes de qualquer contratação.

## Arquitetura

```
src/
  motion/        gsap.ts (registro/config) · useMotion.ts (escopo + limpeza)
  config/        simulators.ts (fatores, prazos, faixas, zonas de calor) · site.ts (env) · images.ts
  lib/           money.ts (BigInt, centavos) · calculator.ts (parcela cheia e reduzida)
                 validation.ts · tracking.ts · attribution.ts · whatsapp.ts
  services/      leadService.ts (envio único ao ver o resultado)
  components/    Header (só a marca) · Hero (formulário na entrada) · ResultPage (/resultado) · Footer
                 SceneBackground (fundo que muda com imóvel / veículo)
    funnel/      LeadForm (etapa única) · fields (TextField, MoneyField, ChoiceGroup)
    privacy/     PrivacyNotice · PrivacyContext
    ui/          Button · StockImage · Type (Lines, Words)
```

### Jornada

Duas páginas: o formulário (`/`) e o resultado (`/resultado`). O `vercel.json` reescreve
`/resultado` para o app; abrir esse endereço direto, sem simulação, volta ao formulário.

1. **Formulário em etapa única**: imóvel ou veículo, **renda mensal**, **possui dinheiro guardado?**
   (se "Sim", aparece **quanto**), **valor do imóvel/veículo** (a pergunta usa a palavra escolhida),
   **primeiro nome** e **telefone**. O botão **Ver meu resultado** fica bloqueado até tudo estar válido,
   com uma linha dizendo o que falta.
2. **Fundo que acompanha a escolha**: casas para imóvel; carros e motos se alternando para veículo
   (fotos do cliente em `public/assets/scenes`, tratadas por `scripts/scenes.py`). O título também
   muda: "Seu imóvel cabe no seu mês?" / "Seu veículo cabe no seu mês?".
3. Ao confirmar, o lead é enviado uma única vez; o resultado abre assim que a API confirma, ou em no
   máximo 4 s. Uma cortina cobre a tela com o objetivo e se abre na página de resultado.
4. **Página de resultado**: "Investimento mensal de apenas R$ …" em destaque (o valor reduzido quando a
   regra tem). A pedido do cliente, o site e a mensagem do WhatsApp não mostram a parcela cheia nem usam
   a palavra "parcela"; o aviso do rodapé diz que o valor mensal pode variar ao longo do plano. Também traz o resumo e o contato do consultor (WhatsApp com a simulação na mensagem e telefone).
   No celular, o botão do WhatsApp fica fixo no rodapé ao rolar.

### Cálculo (regras do cliente)

Em **centavos com BigInt** e arredondamento half-up. A taxa de administração não é reduzida:

```
parcela cheia    = (valor × fator) ÷ prazo
parcela reduzida = (valor ÷ prazo) × percentual + (valor × (fator − 1)) ÷ prazo
```

| Objetivo | Fator | Prazo | Parcela em destaque | Exemplo do cliente (teste) |
| --- | --- | --- | --- | --- |
| Imóvel | 1,24 | 220 meses | reduzida 70% | R$ 200.000 → cheia R$ 1.127,27 · reduzida R$ 854,54 |
| Veículo a partir de R$ 30 mil | 1,162 | 90 meses | reduzida 50% | R$ 40.000 → cheia R$ 516,44 · reduzida R$ 294,22 |
| Veículo abaixo de R$ 30 mil | 1,282 | 60 meses | somente cheia | R$ 20.000 → R$ 427,33 |

As regras ficam em `src/config/simulators.ts`. O WhatsApp do consultor fica em `src/config/site.ts`
(pode ser trocado por `VITE_WHATSAPP_NUMBER`).

### Rastreamento

Eventos enviados para `window.dataLayer` (e `fbq`, se o Pixel estiver configurado), sempre com as UTMs da sessão:

| Evento | Quando | Meta Pixel |
| --- | --- | --- |
| `page_view` | carregamento (uma vez) | `PageView` |
| `lead_form_submitted` | **somente** após resposta 2xx da API ao envio do formulário | `Lead` |
| `simulation_started` | 1ª interação com o formulário | `SimulationStarted` (custom) |
| `simulation_completed` | clique em Ver meu resultado com dados válidos (`objective`, `rule`) | `SimulationCompleted` (custom) |
| `result_viewed` | chegada na página de resultado (`objective`, `rule`) | `ViewContent` |
| `whatsapp_clicked` | botão de WhatsApp ou telefone (`location`, `objective`) | `Contact` |

Nome, telefone, renda e valores **nunca** são enviados para GTM/Pixel. As UTMs e click IDs ficam em `sessionStorage` e
seguem junto com o cadastro. Use GTM **ou** Pixel direto, não os dois para o mesmo Pixel.

### Backend

Contrato em [docs/api-contract.md](docs/api-contract.md) e tabelas sugeridas em [docs/schema.sql](docs/schema.sql).
Nenhum dado pessoal é salvo no navegador.

## Capa de link (WhatsApp, Instagram, Facebook, X)

- Imagem: `public/assets/og/chave-og-v1.jpg` (1200×630, JPG, ~130 KB).
- Desenho: `scripts/og/capa.html`, com as cores e a tipografia do site. Para gerar de novo:
  `python scripts/og-image.py` (usa o Chrome em modo headless e o Pillow).
- O domínio público fica em `.env.production` (`VITE_SITE_URL`): as metatags precisam de URL absoluta.
  Ao trocar de domínio, atualize esse arquivo. Sem ele, o build avisa e a capa não aparece nas redes.
- Ao trocar a capa, suba a versão do arquivo (`-v2`, `-v3`) no script e no `index.html`;
  WhatsApp e Facebook guardam a imagem antiga em cache. Para forçar a atualização no Facebook
  e no Instagram, use o Sharing Debugger da Meta.

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
