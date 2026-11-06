import { PLANS } from '../../config/simulators';
import { CreditInput } from './CreditInput';

interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
  invalid: boolean;
}

export function PropertySimulator({ value, onChange, invalid }: Props) {
  return (
    <>
      <CreditInput
        label="Valor do crédito desejado"
        value={value}
        range={PLANS.imovel.credit}
        onChange={onChange}
        invalid={invalid}
      />
      <p className="mt-5 text-[0.82rem] leading-relaxed text-offwhite/45">
        Prazos e créditos disponíveis dependem dos grupos em formação.
      </p>
    </>
  );
}
