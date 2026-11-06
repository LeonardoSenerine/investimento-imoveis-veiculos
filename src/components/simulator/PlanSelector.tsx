import { useRef, type KeyboardEvent } from 'react';
import { PLANS, type PlanId } from '../../config/simulators';
import { cn } from '../../lib/cn';
import { formatReaisShort } from '../../lib/money';

export const PLAN_ORDER: PlanId[] = ['imovel', 'automovel', 'moto'];

const rangeText = (id: PlanId) => {
  const { credit } = PLANS[id];
  if (id === 'moto') return `até ${formatReaisShort(credit.max)}`;
  if (id === 'automovel') return `a partir de ${formatReaisShort(credit.min)}`;
  return `${formatReaisShort(credit.min)} a ${formatReaisShort(credit.max)}`;
};

interface Props {
  value: PlanId;
  onChange: (id: PlanId) => void;
}

/** Seleção de plano como índice editorial (radiogroup acessível por setas). */
export function PlanSelector({ value, onChange }: Props) {
  const refs = useRef<Record<PlanId, HTMLButtonElement | null>>({ imovel: null, automovel: null, moto: null });

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const dir = ['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : ['ArrowUp', 'ArrowLeft'].includes(e.key) ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = PLAN_ORDER[(PLAN_ORDER.indexOf(value) + dir + PLAN_ORDER.length) % PLAN_ORDER.length];
    onChange(next);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Objetivo" className="border-t border-charcoal/15">
      {PLAN_ORDER.map((id) => {
        const active = id === value;
        const plan = PLANS[id];
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[id] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={onKey}
            className={cn(
              'group relative grid w-full grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-charcoal/15 py-4 text-left transition-colors duration-500 md:py-5',
              active ? 'text-charcoal' : 'text-charcoal/45 hover:text-charcoal/75',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute -bottom-px left-0 h-px bg-copper transition-[width] duration-700 ease-[var(--ease-expo)]',
                active ? 'w-full' : 'w-0',
              )}
            />
            <span className="font-display text-[1.3rem] font-semibold tracking-[-0.02em] md:text-[1.5rem]">
              {plan.label}
            </span>
            <span className="tabular text-right text-xs leading-snug md:text-sm">
              {Math.min(...plan.termOptions)} a {Math.max(...plan.termOptions)} meses
              <span className="hidden sm:block">{rangeText(id)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
