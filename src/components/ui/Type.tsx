import { Fragment, type ReactNode } from 'react';
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

/** Texto dividido em palavras para o "word reveal" com scrub. */
export function Words({ text, highlight = [] }: { text: string; highlight?: string[] }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className={cn('word', highlight.includes(w.replace(/[.,—]/g, '')) && 'text-champagne')}>{w}</span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </>
  );
}

/** Rótulo editorial em caixa alta: "02 / Simulação". */
export function Label({
  index,
  children,
  tone = 'dark',
  className,
}: {
  index?: string;
  children: ReactNode;
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <p className={cn('label flex items-center gap-3', tone === 'light' ? 'text-charcoal/55' : 'text-offwhite/50', className)}>
      {index && (
        <>
          <span className={cn('tabular', tone === 'light' ? 'text-wood' : 'text-copper')}>{index}</span>
          <span aria-hidden="true" className="h-px w-6 bg-current opacity-40" />
        </>
      )}
      <span>{children}</span>
    </p>
  );
}
