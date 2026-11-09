import { SITE } from '../config/site';
import { useScrollPast } from '../hooks/useScrollPast';
import { cn } from '../lib/cn';

/** Cabeçalho mínimo: só a marca. O formulário já está na tela. */
export function Header() {
  const scrolled = useScrollPast(40);

  return (
    <header
      data-site-header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter] duration-700',
        scrolled ? 'bg-charcoal/95 lg:bg-charcoal/85 lg:backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[90rem] items-center px-5 md:h-20 md:px-10">
        <a href="#inicio" className="flex min-h-11 items-center gap-3" aria-label="Voltar ao início">
          <span className="font-display text-[0.98rem] font-semibold tracking-[-0.02em] text-offwhite">
            {SITE.descriptor}
          </span>
          <span className="hidden whitespace-nowrap text-sm text-offwhite/45 sm:inline">
            {SITE.descriptorDetail.toLowerCase()}
          </span>
        </a>
      </div>
    </header>
  );
}
