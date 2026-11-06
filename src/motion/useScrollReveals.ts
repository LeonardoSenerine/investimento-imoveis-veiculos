import { useLayoutEffect } from 'react';
import { MEDIA, ScrollTrigger, gsap, isLowPower } from './gsap';

/**
 * Animações declarativas por atributo, aplicadas uma única vez na página:
 *
 *  data-reveal="lines"   linhas (.line-inner) sobem de dentro de uma máscara
 *  data-reveal="words"   palavras (.word) acendem conforme a rolagem (scrub)
 *  data-reveal="image"   moldura abre por clip-path e a foto desacelera a escala
 *  data-parallax="12"    deslocamento vertical em % durante a rolagem
 *
 * Usado só nos pontos de maior impacto — o resto da página é estático de propósito.
 */
export function useScrollReveals() {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(MEDIA, (context) => {
      const { motion, desktop } = context.conditions as Record<keyof typeof MEDIA, boolean>;
      if (!motion) return;
      const q = <T extends Element>(sel: string) => gsap.utils.toArray<T>(sel);

      q<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
        gsap.from(el.querySelectorAll('.line-inner'), {
          yPercent: 112,
          duration: 1.15,
          stagger: 0.085,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        });
      });

      q<HTMLElement>('[data-reveal="words"]').forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll('.word'),
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.12,
            scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: 0.6 },
          },
        );
      });

      q<HTMLElement>('[data-reveal="image"]').forEach((frame) => {
        const img = frame.querySelector('img');
        const inset = desktop ? 'inset(14% 10% 14% 10%)' : 'inset(8% 6% 8% 6%)';
        const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 82%', once: true } });
        tl.fromTo(frame, { clipPath: inset }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' });
        if (img) tl.from(img, { scale: 1.28, duration: 2, ease: 'expo.out' }, 0.1);
      });

      if (!isLowPower()) {
        q<HTMLElement>('[data-parallax]').forEach((el) => {
          const amount = Number(el.dataset.parallax || 10) * (desktop ? 1 : 0.5);
          gsap.fromTo(
            el,
            { yPercent: -amount },
            {
              yPercent: amount,
              ease: 'none',
              scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          );
        });
      }
    });

    // Recalcula posições quando as fontes carregam e sempre que a altura da
    // página muda (formulário revelado, accordion aberto, troca de plano).
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    let timer = 0;
    let lastHeight = document.body.scrollHeight;
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            const h = document.body.scrollHeight;
            if (Math.abs(h - lastHeight) < 2) return;
            lastHeight = h;
            window.clearTimeout(timer);
            timer = window.setTimeout(() => ScrollTrigger.refresh(), 220);
          })
        : null;
    ro?.observe(document.body);

    return () => {
      ro?.disconnect();
      window.clearTimeout(timer);
      mm.revert();
    };
  }, []);
}
