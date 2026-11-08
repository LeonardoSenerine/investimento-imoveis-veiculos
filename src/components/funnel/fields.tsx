import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '../../lib/cn';
import { formatReais, parseReaisInput } from '../../lib/money';

const box =
  'flex h-14 w-full items-center gap-2 rounded-md bg-charcoal/70 px-4 shadow-[inset_0_0_0_1px_rgb(243_240_234/0.14)] transition-shadow duration-300 focus-within:shadow-[inset_0_0_0_1.5px_rgb(217_166_111/0.95)]';
const boxError = 'shadow-[inset_0_0_0_1.5px_rgb(229_155_133/0.9)]';
const inputBase =
  'h-full w-full min-w-0 bg-transparent text-[1.05rem] font-semibold text-offwhite outline-none placeholder:font-medium placeholder:text-offwhite/30';

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-offwhite/85">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-msg`} className="mt-2 text-sm font-medium text-alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="mt-2 text-[0.8rem] text-offwhite/50">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  error,
  hint,
  inputRef,
  className,
  ...props
}: {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
} & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = props.id ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className={cn(box, error && boxError)}>
        <input
          ref={inputRef}
          {...props}
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={cn(inputBase, className)}
        />
      </div>
    </FieldShell>
  );
}

/** Valor em reais inteiros, formatado enquanto digita ("10.000"). */
export function MoneyField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  hint,
  error,
  inputRef,
  name,
  onBlur,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  suffix?: string;
  hint?: ReactNode;
  error?: string | null;
  inputRef?: Ref<HTMLInputElement>;
  name?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className={cn(box, error && boxError)}>
        <span aria-hidden="true" className="text-base font-semibold text-champagne/80">
          R$
        </span>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="next"
          placeholder={placeholder}
          value={value === null ? '' : formatReais(value)}
          onChange={(e) => onChange(parseReaisInput(e.target.value))}
          onBlur={onBlur}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={cn(inputBase, 'tabular text-[1.2rem]')}
        />
        {suffix && (
          <span aria-hidden="true" className="shrink-0 whitespace-nowrap text-sm text-offwhite/45">
            {suffix}
          </span>
        )}
      </div>
    </FieldShell>
  );
}

export interface Choice<T extends string | number> {
  value: T;
  label: string;
}

/** Escolha única por toque (radio acessível com aparência de botão). */
export function ChoiceGroup<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  columns,
}: {
  legend: string;
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Quantidade fixa de colunas (padrão: quebra livre). */
  columns?: number;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-offwhite/85">{legend}</legend>
      <div
        className={cn('mt-2 gap-2', columns ? 'grid' : 'flex flex-wrap')}
        style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
      >
        {options.map((opt) => (
          <label key={String(opt.value)} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={String(opt.value)}
              checked={opt.value === value}
              onChange={() => onChange(opt.value)}
              className="peer sr-only"
            />
            <span className="tabular flex h-12 min-w-[3.5rem] items-center justify-center rounded-md px-3 text-[0.95rem] font-semibold text-offwhite/70 shadow-[inset_0_0_0_1px_rgb(243_240_234/0.14)] transition-[background-color,box-shadow,color,transform] duration-300 hover:text-offwhite hover:shadow-[inset_0_0_0_1px_rgb(243_240_234/0.4)] active:translate-y-px peer-checked:bg-champagne peer-checked:text-charcoal peer-checked:shadow-none peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-champagne">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
