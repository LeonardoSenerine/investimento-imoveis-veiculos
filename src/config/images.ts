/**
 * Fotografias de banco de imagens (Unsplash — licença Unsplash, uso comercial
 * permitido). Em produção, recomenda-se hospedar versões otimizadas no próprio
 * domínio/CDN. As URLs usam o redimensionamento automático da Unsplash
 * (formato AVIF/WebP via `auto=format`).
 */

export interface StockImage {
  id: string;
  alt: string;
  /** Ponto focal CSS (object-position). */
  focus?: string;
}

/*
 * Direção fotográfica (moodboard do cliente): noite ou pôr do sol, luz âmbar,
 * madeira, concreto e superfícies escuras. Todas as fotos abaixo têm de 2.600
 * a 8.200 px no lado maior e são licença Unsplash gratuita (não Unsplash+).
 */
export const IMAGES = {
  hero: {
    id: 'photo-1757524492552-d47a66a2b63e',
    alt: 'Casa contemporânea com janelas iluminadas em tom âmbar ao pôr do sol, emoldurada por árvores',
    focus: '58% 62%',
  },
  property: {
    id: 'photo-1748063578185-3d68121b11ff',
    alt: 'Casa contemporânea com fachadas de vidro e iluminação quente ao entardecer',
    focus: '55% 55%',
  },
  propertyFacade: {
    id: 'photo-1600585154340-be6161a56a0c',
    alt: 'Residência em madeira e vidro iluminada ao entardecer',
    focus: '62% 55%',
  },
  vehicle: {
    id: 'photo-1764605206502-05e48ab08d82',
    alt: 'Sedã preto de luxo com reflexos de luz âmbar no asfalto à noite',
    focus: '35% 70%',
  },
  motorcycle: {
    id: 'photo-1656420731047-3eb41c9d1dee',
    alt: 'Motocicleta preta com farol aceso em estúdio escuro',
    focus: '50% 72%',
  },
  motorcycleWide: {
    id: 'photo-1661215477041-ec4501e00042',
    alt: 'Motocicleta escura diante de um portão metálico iluminado',
    focus: '50% 58%',
  },
  headlight: {
    id: 'photo-1516610540415-d1b25463c7f3',
    alt: 'Farol de automóvel aceso diante de um céu laranja ao pôr do sol',
    focus: '55% 60%',
  },
  slats: {
    id: 'photo-1675528030748-d463ab87e8d5',
    alt: 'Ripas de madeira iluminadas por luz quente',
    focus: '50% 50%',
  },
  finalCta: {
    id: 'photo-1683219261880-814f901e648b',
    alt: 'Horizonte da cidade ao entardecer, com o sol entre os edifícios',
    focus: '50% 48%',
  },
  marble: {
    id: 'photo-1639674243146-1368706211d3',
    alt: '',
    focus: '50% 50%',
  },
} satisfies Record<string, StockImage>;

const BASE = 'https://images.unsplash.com/';

export function imageUrl(img: StockImage, width: number, quality = 80) {
  return `${BASE}${img.id}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

export function imageSrcSet(img: StockImage, widths: number[], quality = 80) {
  return widths.map((w) => `${imageUrl(img, w, quality)} ${w}w`).join(', ');
}

/**
 * Fundos do formulário e do resultado (fotos enviadas pelo cliente, tratadas
 * por scripts/scenes.py). Imóvel mostra casas; veículo alterna carros e motos.
 */
export interface Scene {
  name: string;
  alt: string;
  /** Larguras geradas por scripts/scenes.py. */
  widths: readonly number[];
  /** Ponto focal CSS (object-position). */
  focus: string;
}

/** Fotos ampliadas 4x com IA (Real-ESRGAN) e exportadas em WebP nestas larguras. */
const SCENE_WIDTHS = [828, 1440, 2160] as const;

const scene = (name: string, alt: string, focus: string): Scene => ({ name, alt, focus, widths: SCENE_WIDTHS });

export const SCENES = {
  imovel: [
    scene('casa-piscina', 'Casa moderna com piscina iluminada ao entardecer', '50% 45%'),
    scene('casa-noturna', 'Fachada contemporânea com caminho iluminado à noite', '55% 45%'),
    scene('casa-garagem', 'Casa moderna branca e grafite com carro na garagem ao anoitecer', '50% 50%'),
    scene('casa-sedan', 'Casa contemporânea ao pôr do sol com sedã preto na entrada', '50% 55%'),
  ],
  veiculo: [
    scene('carro-preto-cidade', 'Esportivo preto em um terraço com a cidade ao pôr do sol', '50% 58%'),
    scene('moto-por-do-sol', 'Moto esportiva preta na praia ao pôr do sol', '50% 68%'),
    scene('carro-vermelho-rio', 'Esportivo vermelho com vista para o mar ao entardecer', '50% 60%'),
    scene('moto-showroom', 'Moto esportiva prata em showroom escuro', '55% 60%'),
    scene('carro-branco-serra', 'Esportivo branco de portas abertas na serra ao amanhecer', '40% 62%'),
    scene('moto-noite', 'Moto esportiva preta estacionada à noite', '50% 55%'),
    scene('carro-vermelho-noite', 'Esportivo vermelho com luz baixa vermelha à noite', '45% 55%'),
    scene('moto-urbana', 'Moto preta com rodas douradas em uma faixa de pedestres', '40% 62%'),
  ],
} satisfies Record<string, Scene[]>;

export const sceneUrl = (s: Scene, w: number) => `/assets/scenes/${s.name}-${w}.webp`;
export const sceneSrcSet = (s: Scene) => s.widths.map((w) => `${sceneUrl(s, w)} ${w}w`).join(', ');
