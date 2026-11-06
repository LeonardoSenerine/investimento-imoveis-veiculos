import { useRef } from 'react';
import { cn } from '../lib/cn';
import { ScrollTrigger, gsap } from '../motion/gsap';
import { useMotion } from '../motion/useMotion';
import { ButtonLink } from './ui/Button';
import { Lines } from './ui/Type';

const STEPS = [
  {
    title: 'Escolha seu objetivo',
    text: 'Imóvel, automóvel ou motocicleta: defina o que você quer planejar.',
  },
  {
    title: 'Descubra quanto cabe no seu mês',
    text: 'Informe o valor que você pode investir e veja o crédito estimado como referência inicial.',
  },
  {
    title: 'Entenda as condições do plano',
    text: 'Taxa de administração, reajustes e como o crédito é liberado, explicados antes de qualquer decisão.',
  },
  {
    title: 'Siga com o atendimento especializado',
    text: 'Converse com um especialista para comparar opções e tirar dúvidas, no seu ritmo.',
  },
];

export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  // O trilho de cobre acompanha a leitura; cada etapa acende ao cruzar o centro da tela.
  useMotion(root, (_ctx, el) => {
    const list = el.querySelector('[data-steps]');
    gsap.fromTo(
      el.querySelector('[data-rail]'),
      { scaleY: 0 },
      { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 60%', end: 'bottom 60%', scrub: true } },
    );
    el.querySelectorAll('[data-step]').forEach((step) => {
      ScrollTrigger.create({ trigger: step, start: 'top 62%', end: 'bottom 62%', toggleClass: 'is-active' });
    });
  });

  return (
    <section
      ref={root}
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      className="grain relative bg-charcoal py-28 md:py-44"
    >
      <div className="relative z-[2] mx-auto grid max-w-[90rem] grid-cols-1 gap-16 px-5 md:px-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <h2
              id="como-funciona-title"
              data-reveal="lines"
              className="display text-[clamp(2.2rem,9.4vw,3rem)] text-offwhite md:text-[clamp(2.8rem,4.4vw,4.2rem)]"
            >
              <Lines
                lines={['Etapa', 'por etapa.']}
                lineClassName={(i) => (i === 1 ? 'pl-[14%]' : '')}
              />
            </h2>
            <p className="mt-6 max-w-sm leading-relaxed text-offwhite/60">
              Uma compra planejada, sem pressa e sem surpresa. Entender cada fase ajuda você a decidir com segurança.
            </p>
            <div className="mt-10 hidden max-w-xs lg:block">
              <ButtonLink href="#simulador" variant="outline" icon={false} fullWidth>
                Fazer minha simulação
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7">
          {/* Trilho de progresso */}
          <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px bg-offwhite/10" />
          <span
            data-rail
            aria-hidden="true"
            className="absolute bottom-0 left-0 top-0 w-px origin-top bg-gradient-to-b from-copper to-champagne"
          />

          <ol data-steps className="pl-7 md:pl-14">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                data-step
                className={cn(
                  'group/step relative py-10 md:py-14',
                  i > 0 && 'border-t border-offwhite/[0.07]',
                )}
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-7 top-[3.25rem] h-px w-4 bg-offwhite/20 transition-colors duration-500 group-[.is-active]/step:bg-champagne md:-left-14 md:top-[4.5rem] md:w-8"
                />
                <span
                  aria-hidden="true"
                  className="display numeral-outline block text-[4.5rem] leading-none transition-[color,-webkit-text-stroke-color] duration-700 group-[.is-active]/step:text-champagne md:text-[7.5rem]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 max-w-md font-display text-xl font-semibold leading-snug tracking-[-0.02em] text-offwhite md:text-2xl">
                  <span className="sr-only">Etapa {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-3 max-w-md leading-relaxed text-offwhite/55">{s.text}</p>
              </li>
            ))}
          </ol>

          <p className="ml-7 border-t border-offwhite/[0.07] pt-8 text-sm leading-relaxed text-offwhite/45 md:ml-14">
            O crédito é liberado por sorteio ou lance, conforme as regras de cada grupo. Não existe data garantida
            para a liberação.
          </p>
        </div>
      </div>
    </section>
  );
}
