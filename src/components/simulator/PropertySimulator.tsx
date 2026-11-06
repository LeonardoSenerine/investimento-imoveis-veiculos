import { PLANS } from '../../config/simulators';
import { monthlyRange } from '../../lib/calculator';
import { CreditInput } from './CreditInput';
import { TermSelector } from './TermSelector';

interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
  term: number;
  onTermChange: (months: number) => void;
  invalid: boolean;
}

const plan = PLANS.imovel;

export function PropertySimulator({ value, onChange, term, onTermChange, invalid }: Props) {
  const range = { ...monthlyRange(plan, term), step: plan.monthly.step, quickPicks: plan.monthly.quickPicks };
  return (
    <>
      <CreditInput
        label="Quanto você pode investir por mês"
        value={value}
        range={range}
        onChange={onChange}
        invalid={invalid}
        suffix="por mês"
      />
      <TermSelector options={plan.termOptions} value={term} onChange={onTermChange} />
      <p className="mt-5 text-[0.82rem] leading-relaxed text-offwhite/45">
        Para casa, apartamento, terreno ou construção, conforme as regras do contrato.
      </p>
    </>
  );
}
