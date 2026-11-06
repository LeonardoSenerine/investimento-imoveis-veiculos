import { useRef } from 'react';
import { IMAGES } from '../config/images';
import { PLANS } from '../config/simulators';
import { formatReaisShort } from '../lib/money';
import { gsap } from '../motion/gsap';
import { useMotion } from '../motion/useMotion';
import { ButtonLink, ButtonNote } from './ui/Button';
import { StockImage } from './ui/StockImage';
import { Lines } from './ui/Type';

const INDEX = [
  { label: 'Imóveis', meta: `até ${Math.max(...PLANS.imovel.termOptions)} meses` },
  { label: 'Automóveis', meta: `desde ${formatReaisShort(PLANS.automovel.credit.min)}` },
  { label: 'Motocicletas', meta: `até ${formatReaisShort(PLANS.moto.credit.max)}` },
];

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useMotion(root, ({ desktop, lowPower }, el) => {
    const frame = el.querySelector('[data-hero-frame]');
    const photo = el.querySelector('[data-hero-photo] img');
    const header = document.querySelector('[data-site-header]');

    // Entrada coreografada: a foto abre por clip-path, o título sobe por linhas,
    // os elementos secundários entram em sequência.
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro
      .fromTo(
        frame,
        { clipPath: desktop ? 'inset(20% 24% 20% 24%)' : 'inset(18% 8% 34% 8%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' },
      )
      .fromTo(photo, { scale: 1.35 }, { scale: 1, duration: 2.6 }, 0)
      .from(el.querySelectorAll('[data-hero-title] .line-inner'), { yPercent: 112, duration: 1.25, stagger: 0.09 }, 0.85)
      .from(el.querySelector('[data-hero-rule]'), { scaleX: 0, duration: 1.6, ease: 'expo.inOut' }, 0.95)
      .from(el.querySelectorAll('[data-hero-fade]'), { y: 22, opacity: 0, duration: 1.1, stagger: 0.07 }, 1.2);
    if (header) intro.from(header, { yPercent: -100, opacity: 0, duration: 1.1 }, 1.1);

    if (lowPower) return;

    // Profundidade na rolagem: a foto desce mais devagar que o conteúdo,
    // que sobe e esmaece; a sombra cresce até virar a próxima seção.
    const scroll = { trigger: el, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(el.querySelector('[data-hero-photo]'), { yPercent: 16, scale: 1.08, ease: 'none', scrollTrigger: scroll });
    gsap.to(el.querySelector('[data-hero-content]'), {
      yPercent: desktop ? -12 : -5,
      opacity: 0.15,
      ease: 'none',
      scrollTrigger: scroll,
    });
    gsap.to(el.querySelector('[data-hero-shade]'), { opacity: 1, ease: 'none', scrollTrigger: scroll });
  });

  return (
    <section
      ref={root}
      id="topo"
      aria-labelledby="hero-title"
      className="grain relative isolate h-[100svh] min-h-[620px] overflow-hidden bg-charcoal md:min-h-[720px]"
    >
      {/* Fotografia em camadas */}
      <div data-hero-frame className="absolute inset-0 -z-10 overflow-hidden">
        <div data-hero-photo className="absolute inset-x-0 -top-[6%] h-[112%] will-change-transform">
          <StockImage
            image={IMAGES.hero}
            priority
            widths={[640, 960, 1280, 1600, 1920, 2560, 3200]}
            sizes="100vw"
            quality={82}
            className="h-full w-full object-cover"
            style={{ filter: 'contrast(1.06) saturate(1.04)' }}
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(21_21_21/0.65)_0%,rgb(21_21_21/0.1)_26%,rgb(21_21_21/0.5)_50%,rgb(21_21_21/0.95)_86%,#151515_100%)] md:bg-[linear-gradient(90deg,rgb(21_21_21/0.82)_0%,rgb(21_21_21/0.45)_38%,rgb(21_21_21/0)_62%),linear-gradient(180deg,rgb(21_21_21/0.5)_0%,transparent_22%,transparent_62%,#151515_100%)]"
        />
        <div data-hero-shade aria-hidden="true" className="absolute inset-0 bg-charcoal opacity-0" />
      </div>

      <div
        data-hero-content
        className="relative z-[2] mx-auto flex h-full max-w-[90rem] flex-col px-5 pb-5 pt-24 md:px-10 md:pb-10 md:pt-32"
      >
        {/* Linha superior: o que é a página e as categorias atendidas */}
        <div className="flex items-start justify-between gap-8">
          <p data-hero-fade className="max-w-[16rem] text-sm leading-snug text-offwhite/70">
            Planejamento para conquistar imóvel, carro ou moto
          </p>
          <ol data-hero-fade className="hidden min-w-[16rem] bg-charcoal/55 px-5 py-3 backdrop-blur-md md:block" aria-label="Categorias">
            {INDEX.map((item) => (
              <li
                key={item.label}
                className="flex items-baseline justify-between gap-x-6 border-b border-offwhite/12 py-2 text-sm last:border-b-0"
              >
                <span className="font-medium text-offwhite/85">{item.label}</span>
                <span className="tabular text-xs text-offwhite/45">{item.meta}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Título com quebras intencionais e recuos assimétricos */}
        <h1
          id="hero-title"
          data-hero-title
          className="display my-auto pt-10 text-[clamp(2rem,8.6vw,3.2rem)] text-offwhite [text-shadow:0_2px_32px_rgb(21_21_21/0.45)] md:text-[clamp(3.4rem,7vw,7.4rem)]"
        >
          <Lines
            lines={[
              'Seu próximo',
              'objetivo começa',
              'com uma boa',
              'escolha.',
            ]}
            lineClassName={(i) => (i === 1 ? 'md:pl-[9%]' : i === 3 ? 'pl-[22%] md:pl-[40%]' : '')}
          />
        </h1>

        {/* Deck inferior: fio, texto de apoio e CTA integrado à grade */}
        <div className="relative">
          <span data-hero-rule aria-hidden="true" className="absolute inset-x-0 top-0 h-px origin-left bg-offwhite/20" />
          <div className="grid grid-cols-1 gap-5 pt-5 md:grid-cols-12 md:items-end md:gap-10 md:pt-8">
            <p data-hero-fade className="max-w-md text-[0.98rem] leading-relaxed text-offwhite/72 md:col-span-6 md:text-lg xl:col-span-5">
              Descubra quanto da sua casa ou do seu carro cabe no seu mês, com planejamento e orientação em cada
              etapa.
            </p>
            <div data-hero-fade className="hidden xl:col-span-3 xl:block">
              <p className="label text-champagne">Resultado na hora</p>
              <p className="mt-2 text-sm leading-relaxed text-offwhite/55">
                Informe quanto pode investir por mês e veja o crédito que dá para planejar, sem cadastro.
              </p>
            </div>
            <div data-hero-fade className="md:col-span-5 md:col-start-8 xl:col-span-4 xl:col-start-auto">
              <ButtonLink href="#simulador" fullWidth>
                Ver quanto cabe no meu mês
              </ButtonLink>
              <ButtonNote className="md:text-left">Sem cadastro para simular</ButtonNote>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de rolagem */}
      <div aria-hidden="true" className="absolute bottom-0 right-10 z-[2] hidden h-24 w-px overflow-hidden bg-offwhite/10 xl:block">
        <span className="block h-full w-full animate-scroll-cue bg-champagne" />
      </div>
    </section>
  );
}
