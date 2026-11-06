import { useLayoutEffect, type DependencyList, type RefObject } from 'react';
import { MEDIA, gsap, isLowPower } from './gsap';

export interface MotionContext {
  desktop: boolean;
  lowPower: boolean;
}

/**
 * Registra animações GSAP com escopo no elemento e limpeza automática
 * (ScrollTriggers, tweens e estilos inline são revertidos no unmount).
 * Com `prefers-reduced-motion: reduce` nada é executado — o conteúdo
 * permanece no estado final, visível e estático.
 */
export function useMotion<T extends HTMLElement>(
  scope: RefObject<T>,
  setup: (ctx: MotionContext, root: T) => void | (() => void),
  deps: DependencyList = [],
) {
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root) return;
    const mm = gsap.matchMedia(root);
    mm.add(MEDIA, (context) => {
      const { motion, desktop } = context.conditions as Record<keyof typeof MEDIA, boolean>;
      if (!motion) return;
      return setup({ desktop, lowPower: isLowPower() }, root);
    });
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
