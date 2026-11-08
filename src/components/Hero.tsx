import { useRef } from 'react';
import { IMAGES } from '../config/images';
import { cn } from '../lib/cn';
import { gsap } from '../motion/gsap';
import { useMotion } from '../motion/useMotion';
import type { Contact } from '../types';
import { ContactStep, type ContactDraft } from './funnel/ContactStep';
import { ValuesStep, type ValuesDraft } from './funnel/ValuesStep';
import { StockImage } from './ui/StockImage';
import { Lines } from './ui/Type';

interface Props {
  step: 'values' | 'contact';
  values: ValuesDraft;
  contact: ContactDraft;
  onValues: (patch: Partial<ValuesDraft>) => void;
  onContact: (patch: Partial<ContactDraft>) => void;
  onStep: (step: 'values' | 'contact') => void;
  onSimulate: (contact: Contact, honeypot: string) => Promise<void>;
}

/** Entrada da página: chamada direta e o formulário já visível. */
export function Hero({ step, values, contact, onValues, onContact, onStep, onSimulate }: Props) {
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
      .fromTo(el.querySelector('[data-hero-frame] img'), { scale: 1.3 }, { scale: 1, duration: 2.2 }, 0)
      .from(el.querySelectorAll('[data-hero-title] .line-inner'), { yPercent: 112, duration: 1.1, stagger: 0.08 }, 0.5)
      // O formulário aparece rápido: ninguém deve esperar animação para preencher.
      .from(el.querySelector('[data-hero-card]'), { y: 24, opacity: 0, duration: 0.9 }, 0.35)
      .from(el.querySelectorAll('[data-hero-fade]'), { y: 16, opacity: 0, duration: 0.9, stagger: 0.06 }, 0.8);
    if (header) intro.from(header, { yPercent: -100, opacity: 0, duration: 0.9 }, 0.6);
  });

  const stepIndex = step === 'values' ? 0 : 1;

  return (
    <section ref={root} id="inicio" aria-labelledby="hero-title" className="grain relative isolate overflow-hidden bg-charcoal">
      <div data-hero-frame className="absolute inset-0 -z-10 overflow-hidden">
        <StockImage
          image={IMAGES.hero}
          priority
          widths={[640, 960, 1280, 1600, 1920, 2560, 3200]}
          sizes="100vw"
          quality={82}
          className="h-full w-full object-cover"
          style={{ filter: 'contrast(1.06) saturate(1.04)' }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(21_21_21/0.75)_0%,rgb(21_21_21/0.55)_35%,rgb(21_21_21/0.92)_70%,#151515_100%)] lg:bg-[linear-gradient(90deg,rgb(21_21_21/0.9)_0%,rgb(21_21_21/0.6)_45%,rgb(21_21_21/0.35)_100%),linear-gradient(180deg,rgb(21_21_21/0.5)_0%,transparent_30%,transparent_70%,#151515_100%)]"
        />
      </div>

      <div className="relative z-[2] mx-auto grid max-w-[90rem] grid-cols-1 gap-8 px-5 pb-14 pt-24 md:px-10 md:pt-32 lg:min-h-[100svh] lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-16">
        <div className="lg:col-span-6 xl:col-span-7">
          <h1
            id="hero-title"
            data-hero-title
            className="display text-[clamp(2.05rem,8.4vw,3rem)] text-offwhite [text-shadow:0_2px_32px_rgb(21_21_21/0.45)] md:mt-5 lg:text-[clamp(3rem,4.8vw,5.6rem)]"
          >
            <Lines lines={['Sua conquista', 'cabe no', 'seu mês?']} lineClassName={(i) => (i === 1 ? 'pl-[10%]' : '')} />
          </h1>
          <p data-hero-fade className="mt-4 max-w-md text-[1rem] leading-relaxed text-offwhite/75 md:mt-6 md:text-lg">
            Informe seus valores, deixe seu contato e descubra na hora se você já consegue.
          </p>

        </div>

        <div className="lg:col-span-6 xl:col-span-5">
          <div
            data-hero-card
            className="grain relative overflow-hidden rounded-lg bg-graphite/95 p-5 text-offwhite shadow-[0_40px_90px_-40px_rgb(0_0_0/0.9)] backdrop-blur-md sm:p-7"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-copper via-champagne/60 to-transparent"
            />
            <div className="relative z-[2]">
              <div className="mb-5 flex items-center gap-3" aria-hidden="true">
                <span className="text-xs font-semibold text-offwhite/55">Passo {stepIndex + 1} de 2</span>
                <span className="flex flex-1 gap-1.5">
                  {[0, 1].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors duration-500',
                        i <= stepIndex ? 'bg-champagne' : 'bg-offwhite/12',
                      )}
                    />
                  ))}
                </span>
              </div>
              {/* Troca de passo com revelação suave */}
              <div key={step} className="animate-reveal-panel">
                {step === 'values' ? (
                  <ValuesStep values={values} onChange={onValues} onDone={() => onStep('contact')} />
                ) : (
                  <ContactStep
                    values={values}
                    contact={contact}
                    onChange={onContact}
                    onBack={() => onStep('values')}
                    onSimulate={onSimulate}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
