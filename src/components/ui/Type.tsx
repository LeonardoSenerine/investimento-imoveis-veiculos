import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Linhas com quebra intencional, cada uma dentro de uma máscara para o
 * "line reveal". Sem JS/animação, o texto aparece normalmente.
 */
export function Lines({ lines, lineClassName }: { lines: ReactNode[]; lineClassName?: (i: number) => string }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className={cn('line-mask', lineClassName?.(i))}>
          <span className="line-inner">
            {line}
            {/* espaço preserva a leitura contínua (leitores de tela, SEO) */}{' '}
          </span>
        </span>
      ))}
    </>
  );
}
