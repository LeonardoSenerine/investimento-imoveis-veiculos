import { useEffect, useState } from 'react';
import { SCENES, sceneSrcSet, sceneUrl } from '../config/images';
import type { Objective } from '../config/simulators';
import { cn } from '../lib/cn';

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Tempo de cada foto antes da próxima. */
const SWAP_MS = 5000;

/**
 * Fundo que acompanha a escolha: casas para imóvel; carros e motos se
 * alternando para veículo. As fotos ficam empilhadas e trocam por fade,
 * com um zoom lento na foto ativa. Só a primeira foto carrega com prioridade;
 * as demais entram aos poucos (uma à frente da que está na tela).
 */
export function SceneBackground({ objective, priority = false }: { objective: Objective; priority?: boolean }) {
  const [index, setIndex] = useState(0);
  // Fotos já liberadas para carregar, por objetivo (evita baixar as 12 de uma vez).
  const [loaded, setLoaded] = useState<Record<Objective, number>>({ imovel: 1, veiculo: 0 });
  const list = SCENES[objective];

  useEffect(() => {
    setIndex(0);
    setLoaded((l) => ({ ...l, [objective]: Math.max(l[objective], 2) }));
    if (reduceMotion()) return;
    const timer = window.setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % list.length;
        setLoaded((l) => ({ ...l, [objective]: Math.max(l[objective], Math.min(list.length, next + 2)) }));
        return next;
      });
    }, SWAP_MS);
    return () => window.clearInterval(timer);
  }, [objective, list.length]);

  return (
    <div data-scene className="absolute inset-0">
      {(Object.keys(SCENES) as Objective[]).flatMap((obj) =>
        SCENES[obj].slice(0, loaded[obj]).map((s, i) => {
          const on = obj === objective && i === index;
          const first = priority && obj === 'imovel' && i === 0;
          return (
            <img
              key={s.name}
              loading={first ? 'eager' : 'lazy'}
              decoding="async"
              {...({ fetchpriority: first ? 'high' : 'low' } as Record<string, string>)}
              sizes="100vw"
              srcSet={sceneSrcSet(s)}
              src={sceneUrl(s, s.widths[1])} // 1440 como padrão
              alt=""
              aria-hidden="true"
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-[opacity,transform] ease-[var(--ease-soft)]',
                on
                  ? 'scale-[1.06] opacity-100 [transition-duration:1400ms,7000ms]'
                  : 'scale-100 opacity-0 [transition-duration:1400ms,1400ms]',
              )}
              style={{ objectPosition: s.focus }}
            />
          );
        }),
      )}
    </div>
  );
}
