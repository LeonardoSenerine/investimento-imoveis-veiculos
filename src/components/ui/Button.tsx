import { ArrowRight, Loader2, type LucideIcon } from 'lucide-react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'dark' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface Common {
  /**
   * primary: ação principal (champagne), sobre fundos escuros ou claros.
   * dark: ação principal sobre fundos claros (carvão).
   * outline: ação secundária sobre fundos escuros.
   */
  variant?: Variant;
  size?: Size;
  /** Ícone colado ao rótulo, à direita. `false` remove. */
  icon?: LucideIcon | false;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

/*
 * Sistema de botões: três alturas fixas, cantos de 6px, rótulo centralizado
 * com o ícone colado a ele. Hover clareia e acende um brilho quente; o clique
 * afunda 1px; desabilitado fica legível em vez de apenas transparente.
 */
const variants: Record<Variant, string> = {
  primary: cn(
    'bg-champagne text-charcoal',
    'hover:bg-champagne-light hover:shadow-[0_14px_34px_-14px_rgb(217_166_111/0.75)]',
    'active:bg-[#cd985e] active:shadow-none',
    'disabled:bg-offwhite/12 disabled:text-offwhite/40',
  ),
  dark: cn(
    'bg-charcoal text-offwhite',
    'hover:bg-graphite hover:shadow-[0_14px_30px_-16px_rgb(21_21_21/0.65)]',
    'active:bg-black active:shadow-none',
    'disabled:bg-charcoal/[0.08] disabled:text-charcoal/40',
  ),
  outline: cn(
    'text-offwhite shadow-[inset_0_0_0_1px_rgb(243_240_234/0.3)]',
    'hover:bg-offwhite/[0.05] hover:text-champagne hover:shadow-[inset_0_0_0_1px_rgb(217_166_111/0.85)]',
    'active:bg-offwhite/[0.08]',
    'disabled:text-offwhite/35 disabled:shadow-[inset_0_0_0_1px_rgb(243_240_234/0.12)]',
  ),
};

const sizes: Record<Size, { root: string; icon: string }> = {
  sm: { root: 'min-h-10 px-4 text-[0.85rem]', icon: 'size-4' },
  md: { root: 'min-h-12 px-5 text-[0.95rem]', icon: 'size-[1.05rem]' },
  lg: { root: 'min-h-14 px-6 text-[0.98rem] md:text-base', icon: 'size-[1.1rem]' },
};

export function buttonClasses({ variant = 'primary', size = 'lg', fullWidth }: Pick<Common, 'variant' | 'size' | 'fullWidth'>) {
  return cn(
    'group/btn relative inline-flex select-none items-center justify-center gap-2.5 rounded-md py-2 text-center font-display font-semibold leading-tight tracking-[-0.005em] [font-stretch:104%]',
    'transition-[background-color,box-shadow,color,transform] duration-300 ease-[var(--ease-soft)] active:translate-y-px',
    'disabled:cursor-not-allowed disabled:shadow-none disabled:active:translate-y-0',
    variants[variant],
    sizes[size].root,
    fullWidth && 'w-full',
  );
}

function Inner({ size = 'lg', icon = ArrowRight, loading, children }: Common) {
  const Icon = loading ? Loader2 : icon;
  return (
    <>
      <span className="text-balance">{children}</span>
      {Icon && (
        <Icon
          aria-hidden="true"
          strokeWidth={2}
          className={cn(
            'shrink-0 transition-transform duration-500 ease-[var(--ease-expo)]',
            sizes[size].icon,
            loading ? 'animate-spin' : 'group-hover/btn:translate-x-1',
          )}
        />
      )}
    </>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  fullWidth,
  children,
  className,
  ...props
}: Omit<Common, 'loading'> & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(buttonClasses({ variant, size, fullWidth }), className)} {...props}>
      <Inner size={size} icon={icon}>
        {children}
      </Inner>
    </a>
  );
}

export function Button({
  variant,
  size,
  icon,
  fullWidth,
  loading,
  children,
  className,
  type = 'button',
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...props}
    >
      <Inner size={size} icon={icon} loading={loading}>
        {children}
      </Inner>
    </button>
  );
}

/** Texto auxiliar logo abaixo de um botão (em vez de espremido dentro dele). */
export function ButtonNote({ children, tone = 'dark', className }: { children: ReactNode; tone?: 'dark' | 'light'; className?: string }) {
  return (
    <p className={cn('mt-3 text-center text-[0.8rem]', tone === 'light' ? 'text-charcoal/55' : 'text-offwhite/55', className)}>
      {children}
    </p>
  );
}
