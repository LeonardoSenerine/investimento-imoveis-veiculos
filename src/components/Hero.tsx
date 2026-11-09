import { useRef } from 'react';
import { OBJECTIVES } from '../config/simulators';
import { gsap } from '../motion/gsap';
import { useMotion } from '../motion/useMotion';
import { LeadForm, type FormDraft, type FormSubmit } from './funnel/LeadForm';
import { SceneBackground } from './SceneBackground';
import { Lines } from './ui/Type';

interface Props {
  draft: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  onSubmit: (data: FormSubmit) => Promise<void>;
}

/** Entrada da página: chamada direta e o formulário já visível. */
export function Hero({ draft, onChange, onSubmit }: Props) {
  const root = useRef<HTMLElement>(null);

  useMotion(root, ({ desktop }, el) => {
    const header = document.querySelector('[data-site-header]');
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro
      .fromTo(
        el.querySelector('[data-hero-frame]'),
        { clipPath: desktop ? 'inset(14% 18% 14% 18%)' : 'inset(10% 6% 30% 6%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' },
      )
      .fromTo(el.querySelector('[data-scene]'), { scale: 1.3 }, { scale: 1, duration: 2.2 }, 0)
      .from(el.querySelectorAll('[data-hero-title] .line-inner'), { yPercent: 112, duration: 1.1, stagger: 0.08 }, 0.5)
      // O formulário aparece rápido: ninguém deve esperar animação para preencher.
      .from(el.querySelector('[data-hero-card]'), { y: 24, opacity: 0, duration: 0.9 }, 0.35)
      .from(el.querySelectorAll('[data-hero-fade]'), { y: 16, opacity: 0, duration: 0.9, stagger: 0.06 }, 0.8);
    if (header) intro.from(header, { yPercent: -100, opacity: 0, duration: 0.9 }, 0.6);
  });

  const noun = OBJECTIVES[draft.objective].noun;

  return (
    <section ref={root} id="inicio" aria-labelledby="hero-title" className="grain relative isolate overflow-hidden bg-charcoal">
      {/* Foto fixa na tela enquanto o formulário rola; o clip-path da moldura recorta o fixed à seção. */}
      <div data-hero-frame className="absolute inset-0 -z-10 overflow-hidden [clip-path:inset(0)]">
        <div className="fixed inset-0">
          <SceneBackground objective={draft.objective} priority />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgb(21_21_21/0.62)_0%,rgb(21_21_21/0.3)_38%,rgb(21_21_21/0.55)_70%,rgb(21_21_21/0.85)_100%)] lg:bg-[linear-gradient(90deg,rgb(21_21_21/0.88)_0%,rgb(21_21_21/0.55)_45%,rgb(21_21_21/0.25)_100%),linear-gradient(180deg,rgb(21_21_21/0.45)_0%,transparent_30%,transparent_70%,rgb(21_21_21/0.7)_100%)]"
          />
        </div>
      </div>

      <div className="relative z-[2] mx-auto grid max-w-[90rem] grid-cols-1 gap-8 px-5 pb-14 pt-24 md:px-10 md:pt-32 lg:min-h-[100svh] lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-16">
        <div className="lg:col-span-6 xl:col-span-7">
          <h1
            id="hero-title"
            data-hero-title
            className="display text-[clamp(2.05rem,8.4vw,3rem)] text-offwhite [text-shadow:0_2px_32px_rgb(21_21_21/0.45)] md:mt-5 lg:text-[clamp(3rem,4.8vw,5.6rem)]"
          >
            <Lines lines={[`Seu ${noun}`, 'cabe no', 'seu mês?']} lineClassName={(i) => (i === 1 ? 'pl-[10%]' : '')} />
          </h1>
          <p data-hero-fade className="mt-4 max-w-md text-[1rem] leading-relaxed text-offwhite/75 md:mt-6 md:text-lg">
            Preencha os dados e veja na hora quanto fica a parcela do seu {noun}.
          </p>
        </div>

        <div className="lg:col-span-6 xl:col-span-5">
          <div
            data-hero-card
            className="grain relative overflow-hidden rounded-lg bg-graphite/80 p-5 text-offwhite shadow-[0_40px_90px_-40px_rgb(0_0_0/0.9)] backdrop-blur-xl sm:p-7 lg:bg-graphite/90"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-copper via-champagne/60 to-transparent"
            />
            <div className="relative z-[2]">
              <LeadForm draft={draft} onChange={onChange} onSubmit={onSubmit} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
