import { useEffect, useRef, useState } from 'react';

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Interpola visualmente um valor em centavos até o alvo (easeOutExpo).
 * O valor final exibido é sempre exatamente o alvo — a interpolação é
 * apenas tipográfica; cálculos e leitores de tela usam o valor exato.
 */
export function useTweenedBigInt(target: bigint, duration = 420): bigint {
  const [display, setDisplay] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (reduceMotion() || current.current === target) {
      current.current = target;
      setDisplay(target);
      return;
    }
    const from = Number(current.current);
    const to = Number(target);
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const value = t === 1 ? target : BigInt(Math.round(from + (to - from) * eased));
      current.current = value;
      setDisplay(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}
