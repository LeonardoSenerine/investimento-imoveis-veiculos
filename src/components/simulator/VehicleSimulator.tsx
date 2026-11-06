import { PLANS, type VehicleKind } from '../../config/simulators';
import { monthlyRange } from '../../lib/calculator';
import { CreditInput } from './CreditInput';
import { TermSelector } from './TermSelector';

interface Props {
  kind: VehicleKind;
  value: number | null;
  onChange: (value: number | null) => void;
  term: number;
  onTermChange: (months: number) => void;
  invalid: boolean;
}

export function VehicleSimulator({ kind, value, onChange, term, onTermChange, invalid }: Props) {
  const plan = PLANS[kind];
  const range = { ...monthlyRange(plan, term), step: plan.monthly.step, quickPicks: plan.monthly.quickPicks };
  return (
    <>
      <CreditInput
        key={kind}
        label="Quanto você pode investir por mês"
        value={value}
        range={range}
        onChange={onChange}
        invalid={invalid}
        suffix="por mês"
      />
      <TermSelector key={`${kind}-term`} options={plan.termOptions} value={term} onChange={onTermChange} />
      <p className="mt-5 text-[0.82rem] leading-relaxed text-offwhite/45">
        {kind === 'moto' ? 'Motocicletas' : 'Automóveis'} novos ou usados, conforme as regras de cada grupo.
      </p>
    </>
  );
}
