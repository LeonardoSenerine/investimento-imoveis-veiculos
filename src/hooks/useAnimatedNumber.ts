import { useEffect, useRef, useState } from 'react';

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Interpola um número até o alvo (easeOutExpo). Na primeira montagem parte
 * de `from` (contagem a partir de zero); depois anima do valor atual ao novo.
 * O valor final é sempre exatamente o alvo.
 */
export function useAnimatedNumber(target: number, { duration = 900, from = 0 } = {}): number {
  const [display, setDisplay] = useState(reduceMotion() ? target : from);
  const current = useRef(reduceMotion() ? target : from);

  useEffect(() => {
    if (reduceMotion() || current.current === target) {
      current.current = target;
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const origin = current.current;
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const value = t === 1 ? target : origin + (target - origin) * eased;
      current.current = value;
      setDisplay(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}
