import { useId } from 'react';

interface Props {
  options: number[];
  value: number;
  onChange: (months: number) => void;
}

/** Escolha do prazo em meses, por toque. */
export function TermSelector({ options, value, onChange }: Props) {
  const id = useId();
  return (
    <fieldset className="mt-8" aria-describedby={`${id}-hint`}>
      <legend className="label text-offwhite/50">Em quantos meses</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((months) => (
          <label key={months} className="cursor-pointer">
            <input
              type="radio"
              name={`${id}-term`}
              value={months}
              checked={months === value}
              onChange={() => onChange(months)}
              className="peer sr-only"
            />
            <span className="tabular inline-flex h-11 min-w-[3.5rem] items-center justify-center rounded-md px-3 text-sm font-semibold text-offwhite/65 shadow-[inset_0_0_0_1px_rgb(243_240_234/0.14)] transition-[background-color,box-shadow,color,transform] duration-300 hover:text-offwhite hover:shadow-[inset_0_0_0_1px_rgb(243_240_234/0.4)] active:translate-y-px peer-checked:bg-champagne peer-checked:text-charcoal peer-checked:shadow-none peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-champagne">
              {months}
            </span>
          </label>
        ))}
      </div>
      <p id={`${id}-hint`} className="mt-3 text-[0.8rem] leading-relaxed text-offwhite/45">
        Com o mesmo valor por mês, prazos maiores permitem planejar um crédito maior.
      </p>
    </fieldset>
  );
}
