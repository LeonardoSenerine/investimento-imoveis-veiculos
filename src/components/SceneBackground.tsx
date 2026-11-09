import { useEffect, useRef, useState } from 'react';
import { SCENES, sceneSrcSet, sceneUrl, type Scene } from '../config/images';
import type { Objective } from '../config/simulators';
import { cn } from '../lib/cn';

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Tempo de cada foto antes da próxima. */
const SWAP_MS = 5000;
/** Duração do fade entre fotos. */
const FADE_MS = 1200;

interface Slot {
  obj: Objective;
  i: number;
}

/**
 * Fundo que acompanha a escolha: casas para imóvel; carros e motos se
 * alternando para veículo.
 *
 * Para não pesar no celular, só ficam montadas até quatro fotos: a que sai
 * (durante o fade), a que está na tela, a próxima e a primeira da outra opção
 * (essas duas já carregando, invisíveis). A foto
 * ativa recebe um zoom lento, feito só com transform/opacity.
 */
export function SceneBackground({ objective, priority = false }: { objective: Objective; priority?: boolean }) {
  const [active, setActive] = useState<Slot>({ obj: objective, i: 0 });
  const [leaving, setLeaving] = useState<Slot | null>(null);
  const activeRef = useRef(active);
  const clearTimer = useRef<number>();

  const goTo = (next: Slot) => {
    const current = activeRef.current;
    if (current.obj === next.obj && current.i === next.i) return;
    setLeaving(current);
    activeRef.current = next;
    setActive(next);
    window.clearTimeout(clearTimer.current);
    clearTimer.current = window.setTimeout(() => setLeaving(null), FADE_MS + 100);
  };

  useEffect(() => {
    goTo({ obj: objective, i: 0 });
    if (reduceMotion()) return;
    const timer = window.setInterval(() => {
      const { obj, i } = activeRef.current;
      goTo({ obj, i: (i + 1) % SCENES[obj].length });
    }, SWAP_MS);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objective]);

  useEffect(() => () => window.clearTimeout(clearTimer.current), []);

  const sceneAt = (s: Slot) => SCENES[s.obj][s.i];
  const upcoming: Slot = { obj: active.obj, i: (active.i + 1) % SCENES[active.obj].length };

  // Ordem: a que sai embaixo, a ativa por cima; a próxima fica invisível, só pré-carregando.
  const layers: { scene: Scene; role: 'leaving' | 'active' | 'next' }[] = [];
  const seen = new Set<string>();
  const push = (slot: Slot | null, role: 'leaving' | 'active' | 'next') => {
    if (!slot) return;
    const scene = sceneAt(slot);
    if (seen.has(scene.name)) return;
    seen.add(scene.name);
    layers.push({ scene, role });
  };
  push(active, 'active');
  push(leaving, 'leaving');
  push(upcoming, 'next');
  // Primeira foto da outra opção já carregada: a troca Imóvel ↔ Veículo não "pisca".
  push({ obj: active.obj === 'imovel' ? 'veiculo' : 'imovel', i: 0 }, 'next');

  return (
    <div data-scene className="absolute inset-0 overflow-hidden">
      {layers.map(({ scene, role }) => {
        const first = priority && role === 'active' && active.obj === 'imovel' && active.i === 0;
        return (
          <img
            key={scene.name}
            loading={first ? 'eager' : 'lazy'}
            decoding="async"
            {...({ fetchpriority: first ? 'high' : 'low' } as Record<string, string>)}
            sizes="100vw"
            srcSet={sceneSrcSet(scene)}
            src={sceneUrl(scene, scene.widths[1])}
            alt=""
            aria-hidden="true"
            className={cn(
              'absolute inset-0 h-full w-full object-cover ease-[var(--ease-soft)] [backface-visibility:hidden]',
              // Entra com fade (animação roda ao virar ativa) e ganha um zoom lento.
              role === 'active' &&
                'z-[2] scale-[1.05] opacity-100 transition-transform duration-[9000ms] animate-[scene-in_1200ms_cubic-bezier(0.4,0,0.2,1)_both] motion-reduce:animate-none',
              // A que sai fica inteira por baixo até a nova terminar de aparecer (sem "escurecer" no meio).
              role === 'leaving' && 'z-[1] scale-[1.05] opacity-100 transition-transform duration-[9000ms]',
              role === 'next' && 'z-0 scale-100 opacity-0',
            )}
            style={{ objectPosition: scene.focus }}
          />
        );
      })}
    </div>
  );
}
