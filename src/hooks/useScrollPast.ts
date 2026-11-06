import { useEffect, useState } from 'react';

/** `true` quando a rolagem passa de `offset` px (ou fração da altura da tela, se < 1). */
export function useScrollPast(offset: number) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const limit = () => (offset < 1 ? window.innerHeight * offset : offset);
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPast(window.scrollY > limit()));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [offset]);
  return past;
}
