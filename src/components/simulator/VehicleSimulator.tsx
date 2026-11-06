import { PLANS, type VehicleKind } from '../../config/simulators';
import { CreditInput } from './CreditInput';

interface Props {
  kind: VehicleKind;
  value: number | null;
  onChange: (value: number | null) => void;
  invalid: boolean;
}

export function VehicleSimulator({ kind, value, onChange, invalid }: Props) {
  const plan = PLANS[kind];
  return (
    <>
      <CreditInput
        key={kind}
        label={`Valor do crédito — ${plan.label.toLowerCase()}`}
        value={value}
        range={plan.credit}
        onChange={onChange}
        invalid={invalid}
      />
      <p className="mt-5 text-[0.82rem] leading-relaxed text-offwhite/45">
        {kind === 'moto' ? 'Motocicletas' : 'Automóveis'} novos ou usados, conforme as regras de cada grupo.
      </p>
    </>
  );
}
