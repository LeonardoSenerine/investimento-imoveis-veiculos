import { useRef } from 'react';
import { IMAGES } from '../config/images';
import { gsap } from '../motion/gsap';
import { useMotion } from '../motion/useMotion';
import { ButtonLink } from './ui/Button';
import { StockImage } from './ui/StockImage';
import { Label, Lines } from './ui/Type';

export function FinalCTA() {
  const root = useRef<HTMLElement>(null);

  // A moldura se expande até ocupar a tela enquanto a foto desacelera.
  useMotion(root, ({ desktop }, el) => {
    const scroll = { trigger: el, start: 'top bottom', end: 'top top', scrub: true };
    gsap.fromTo(
      el.querySelector('[data-cta-frame]'),
      { clipPath: desktop ? 'inset(12% 10% 0% 10%)' : 'inset(6% 5% 0% 5%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: scroll },
    );
    gsap.fromTo(el.querySelector('[data-cta-photo]'), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: scroll });
  });

  return (
    <section ref={root} id="cta-final" aria-labelledby="cta-final-title" className="relative bg-charcoal">
      <div data-cta-frame className="grain relative isolate flex min-h-[100svh] items-end overflow-hidden">
        <div data-cta-photo className="absolute inset-0 -z-20">
          <StockImage
            image={IMAGES.finalCta}
            widths={[640, 1080, 1600, 2200]}
            sizes="100vw"
            className="h-full w-full object-cover"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(21_21_21/0.55)_0%,rgb(21_21_21/0.35)_40%,rgb(21_21_21/0.92)_85%)] md:bg-[linear-gradient(90deg,rgb(21_21_21/0.92)_0%,rgb(21_21_21/0.55)_50%,rgb(21_21_21/0.15)_100%),linear-gradient(180deg,transparent_60%,rgb(21_21_21/0.7)_100%)]"
        />

        <div className="relative z-[2] mx-auto w-full max-w-[90rem] px-5 pb-16 pt-40 md:px-10 md:pb-24">
          <Label>Comece agora</Label>
          <h2
            id="cta-final-title"
            data-reveal="lines"
            className="display mt-6 max-w-5xl text-[clamp(2.6rem,11vw,3.8rem)] text-offwhite md:text-[clamp(4rem,8vw,8rem)]"
          >
            <Lines
              lines={['Seu próximo passo', 'pode começar', <span key="a" className="text-champagne">agora.</span>]}
              lineClassName={(i) => (i === 1 ? 'md:pl-[12%]' : i === 2 ? 'pl-[30%] md:pl-[44%]' : '')}
            />
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 border-t border-offwhite/20 pt-6 md:mt-14 md:grid-cols-12 md:items-end md:gap-10 md:pt-8">
            <p className="max-w-md text-lg leading-relaxed text-offwhite/75 md:col-span-6">
              Faça uma simulação e conheça as possibilidades para seu próximo objetivo.
            </p>
            <div className="md:col-span-4 md:col-start-9">
              <ButtonLink href="#simulador" fullWidth caption="Resultado na hora">
                Começar minha simulação
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
