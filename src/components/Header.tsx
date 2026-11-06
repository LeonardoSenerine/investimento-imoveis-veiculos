import { useEffect, useRef } from 'react';
import { SITE } from '../config/site';
import { useActiveSection } from '../hooks/useActiveSection';
import { useScrollPast } from '../hooks/useScrollPast';
import { cn } from '../lib/cn';
import { ButtonLink } from './ui/Button';

const LINKS = [
  { id: 'objetivo', label: 'Objetivos' },
  { id: 'simulador', label: 'Simulador' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'duvidas', label: 'Dúvidas' },
];

/** Fio de progresso de leitura (segue a rolagem nativa, sem animação própria). */
function ScrollProgress() {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return (
    <span
      ref={bar}
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-copper to-champagne"
    />
  );
}

export function Header() {
  const scrolled = useScrollPast(40);
  const active = useActiveSection(LINKS.map((l) => l.id));

  return (
    <header
      data-site-header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter] duration-700',
        scrolled ? 'bg-charcoal/85 backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-6 px-5 md:h-20 md:px-10">
        <a href="#topo" className="flex items-baseline gap-3" aria-label="Voltar ao início">
          <span className="font-display text-[0.98rem] font-semibold tracking-[-0.02em] text-offwhite">
            {SITE.descriptor}
          </span>
          <span className="hidden whitespace-nowrap text-sm text-offwhite/45 sm:inline">
            {SITE.descriptorDetail.toLowerCase()}
          </span>
        </a>

        <nav aria-label="Seções da página" className="hidden xl:block">
          <ul className="flex items-center gap-10">
            {LINKS.map((l) => {
              const isActive = active === l.id;
              return (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'group relative flex items-baseline gap-2 whitespace-nowrap py-2 text-sm font-medium transition-colors duration-500',
                      isActive ? 'text-offwhite' : 'text-offwhite/50 hover:text-offwhite',
                    )}
                  >
                    {l.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-0 -bottom-0.5 h-px origin-left bg-champagne transition-transform duration-700 ease-[var(--ease-expo)]',
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50',
                      )}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <ButtonLink href="#simulador" variant={scrolled ? 'primary' : 'outline'} size="md" icon={false} className="!min-h-10 md:!min-h-11 !text-[0.85rem]">
          Simular
        </ButtonLink>
      </div>
      <ScrollProgress />
    </header>
  );
}
