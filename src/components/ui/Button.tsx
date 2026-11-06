import { ArrowRight, Loader2, type LucideIcon } from 'lucide-react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'light' | 'dark' | 'outline';
type Size = 'md' | 'lg';

interface Common {
  variant?: Variant;
  size?: Size;
  /** Ícone da célula à direita. `false` remove. */
  icon?: LucideIcon | false;
  fullWidth?: boolean;
  loading?: boolean;
  /** Texto auxiliar pequeno acima do rótulo (ex.: "Sem cadastro"). */
  caption?: string;
  children: ReactNode;
}

/*
 * Botão arquitetônico: retângulo de cantos vivos, rótulo + célula de seta
 * separada por um fio. No hover, uma lâmina de cor varre da esquerda e a
 * seta é substituída por outra que entra pela esquerda.
 */
const variants: Record<Variant, { root: string; sweep: string; divider: string }> = {
  primary: {
    root: 'bg-champagne text-charcoal',
    sweep: 'bg-offwhite',
    divider: 'bg-charcoal/20',
  },
  light: {
    root: 'bg-offwhite text-charcoal',
    sweep: 'bg-champagne',
    divider: 'bg-charcoal/15',
  },
  dark: {
    root: 'bg-charcoal text-offwhite',
    sweep: 'bg-graphite-light',
    divider: 'bg-offwhite/15',
  },
  outline: {
    root: 'text-offwhite shadow-[inset_0_0_0_1px_rgb(243_240_234/0.28)] hover:text-charcoal',
    sweep: 'bg-offwhite',
    divider: 'bg-current opacity-25',
  },
};

const sizes: Record<Size, { root: string; cell: string }> = {
  md: { root: 'min-h-12 text-[0.92rem]', cell: 'w-12' },
  lg: { root: 'min-h-14 text-[0.98rem] md:min-h-16 md:text-[1.02rem]', cell: 'w-14 md:w-16' },
};

export function buttonClasses({ variant = 'primary', size = 'lg', fullWidth }: Pick<Common, 'variant' | 'size' | 'fullWidth'>) {
  return cn(
    'group/btn relative isolate inline-flex select-none items-stretch overflow-hidden rounded-[2px] font-display font-semibold tracking-[-0.01em] transition-[color,transform] duration-500 ease-[var(--ease-expo)] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45',
    variants[variant].root,
    sizes[size].root,
    fullWidth && 'w-full',
  );
}

function SwapArrow({ Icon, spin }: { Icon: LucideIcon; spin?: boolean }) {
  if (spin) return <Icon className="size-[1.05rem] animate-spin" strokeWidth={1.75} />;
  return (
    <span className="relative block size-[1.05rem] overflow-hidden">
      <Icon
        className="absolute inset-0 size-full transition-transform duration-500 ease-[var(--ease-expo)] group-hover/btn:translate-x-[160%]"
        strokeWidth={1.75}
      />
      <Icon
        className="absolute inset-0 size-full -translate-x-[160%] transition-transform duration-500 ease-[var(--ease-expo)] group-hover/btn:translate-x-0"
        strokeWidth={1.75}
      />
    </span>
  );
}

function Inner({ variant = 'primary', size = 'lg', icon = ArrowRight, loading, caption, children }: Common) {
  const Icon = loading ? Loader2 : icon;
  const v = variants[variant];
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          '-z-10 absolute inset-0 origin-left scale-x-0 transition-transform duration-[650ms] ease-[var(--ease-expo)] group-hover/btn:scale-x-100',
          v.sweep,
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col justify-center px-5 py-2 text-left leading-[1.2] md:px-6">
        {caption && <span className="label mb-1 !text-[0.6rem] opacity-60">{caption}</span>}
        <span className="text-balance">{children}</span>
      </span>
      {Icon && (
        <>
          <span aria-hidden="true" className={cn('my-3 w-px shrink-0', v.divider)} />
          <span aria-hidden="true" className={cn('grid shrink-0 place-items-center', sizes[size].cell)}>
            <SwapArrow Icon={Icon} spin={loading} />
          </span>
        </>
      )}
    </>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  fullWidth,
  caption,
  children,
  className,
  ...props
}: Omit<Common, 'loading'> & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(buttonClasses({ variant, size, fullWidth }), className)} {...props}>
      <Inner variant={variant} size={size} icon={icon} caption={caption}>
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
  caption,
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
      <Inner variant={variant} size={size} icon={icon} loading={loading} caption={caption}>
        {children}
      </Inner>
    </button>
  );
}
