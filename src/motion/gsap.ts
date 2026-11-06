import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Evita "saltos" quando a barra de endereço do celular aparece/some.
ScrollTrigger.config({ ignoreMobileResize: true });

gsap.defaults({ ease: 'expo.out', duration: 1.1 });

/** Condições usadas em todas as animações (gsap.matchMedia). */
export const MEDIA = {
  motion: '(prefers-reduced-motion: no-preference)',
  desktop: '(min-width: 768px)',
} as const;

/** Dispositivos muito modestos recebem só as animações essenciais. */
export const isLowPower = () =>
  typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 2;

export { gsap, ScrollTrigger };

// Apenas em desenvolvimento: permite inspecionar/acelerar a linha do tempo pelo console.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__gsap = gsap;
  (window as unknown as Record<string, unknown>).__ScrollTrigger = ScrollTrigger;
}
