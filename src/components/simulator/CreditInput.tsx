import { useId, type CSSProperties } from 'react';
import type { CreditRange } from '../../config/simulators';
import { cn } from '../../lib/cn';
import { formatReais, formatReaisShort, parseReaisInput } from '../../lib/money';

interface Props {
  label: string;
  value: number | null;
  range: CreditRange;
  onChange: (value: number | null) => void;
  invalid?: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const TICKS = 48;

/**
 * Crédito em destaque: campo monetário + slider sincronizados.
 * O campo aceita qualquer valor (a validação acontece no cálculo);
 * o slider acompanha dentro dos limites do plano.
 */
export function CreditInput({ label, value, range, onChange, invalid }: Props) {
  const id = useId();
  const sliderValue = clamp(value ?? range.min, range.min, range.max);
  const ratio = (sliderValue - range.min) / (range.max - range.min);

  return (
    <div>
      <label htmlFor={`${id}-amount`} className="label text-offwhite/50">
        {label}
      </label>

      <div
        className={cn(
          'group relative mt-4 flex items-baseline gap-3 pb-3',
          'after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:transition-[transform,background-color] after:duration-700 after:ease-[var(--ease-expo)]',
          invalid
            ? 'after:bg-alert'
            : 'after:scale-x-[0.25] after:bg-champagne focus-within:after:scale-x-100',
        )}
      >
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-offwhite/12" />
        <span className="font-display text-xl font-medium text-champagne/70 md:text-2xl" aria-hidden="true">
          R$
        </span>
        <input
          id={`${id}-amount`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          size={1}
          aria-invalid={invalid || undefined}
          value={value === null ? '' : formatReais(value)}
          placeholder="0"
          onChange={(e) => onChange(parseReaisInput(e.target.value))}
          onFocus={(e) => {
            const el = e.currentTarget;
            requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
          }}
          className="figure w-full min-w-0 bg-transparent font-sans text-[clamp(2.5rem,10.5vw,4.4rem)] font-bold leading-none tracking-[-0.04em] text-offwhite caret-champagne outline-none placeholder:text-offwhite/20"
        />
      </div>

      {/* Slider com régua milimetrada */}
      <div className="relative mt-7">
        <input
          type="range"
          aria-label={`${label} (controle deslizante)`}
          aria-valuetext={`R$ ${formatReais(sliderValue)}`}
          min={range.min}
          max={range.max}
          step={range.step}
          value={sliderValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range relative z-10"
          style={{ '--pct': `${ratio * 100}%` } as CSSProperties}
        />
        <div aria-hidden="true" className="pointer-events-none mx-[15px] -mt-2 flex h-3 items-start justify-between">
          {Array.from({ length: TICKS + 1 }, (_, i) => {
            const on = i / TICKS <= ratio;
            const major = i % 12 === 0;
            return (
              <span
                key={i}
                className={cn(
                  'w-px transition-colors duration-300',
                  major ? 'h-3' : 'h-1.5',
                  on ? 'bg-champagne/80' : 'bg-offwhite/15',
                  !major && 'max-sm:even:hidden',
                )}
              />
            );
          })}
        </div>
        <div className="tabular mt-2 flex justify-between text-[0.7rem] font-medium text-offwhite/40">
          <span>{formatReaisShort(range.min)}</span>
          <span>{formatReaisShort(range.max)}</span>
        </div>
      </div>

      {/* Atalhos de valor */}
      <div className="mt-7 grid grid-cols-4 border-y border-offwhite/10" role="group" aria-label="Valores sugeridos">
        {range.quickPicks.map((v) => {
          const active = v === value;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(v)}
              className={cn(
                'relative h-12 border-l border-offwhite/10 text-[0.8rem] font-semibold tabular transition-colors duration-300 first:border-l-0 sm:text-sm',
                active ? 'text-champagne' : 'text-offwhite/55 hover:text-offwhite',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-3 -top-px h-px bg-champagne transition-transform duration-500 ease-[var(--ease-expo)]',
                  active ? 'scale-x-100' : 'scale-x-0',
                )}
              />
              {formatReaisShort(v).replace('R$ ', '')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
