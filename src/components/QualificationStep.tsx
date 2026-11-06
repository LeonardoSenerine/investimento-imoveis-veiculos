import { Check } from 'lucide-react';
import { QUESTIONS, type Answers, type QuestionId } from '../config/qualification';
import { Button } from './ui/Button';

interface Props {
  noun: string;
  answers: Answers;
  onAnswer: (id: QuestionId, value: string) => void;
  onDone: () => void;
}

/** Passo 1 do cadastro: quatro perguntas respondidas com um toque cada. */
export function QualificationStep({ noun, answers, onAnswer, onDone }: Props) {
  const missing = QUESTIONS.filter((q) => !answers[q.id]).length;

  return (
    <div className="flex flex-col">
      <div className="space-y-8">
        {QUESTIONS.map((q) => (
          <fieldset key={q.id}>
            <legend className="text-[0.95rem] font-semibold text-charcoal">{q.label(noun)}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {q.options(noun).map((opt) => (
                <label key={opt.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt.value}
                    checked={answers[q.id] === opt.value}
                    onChange={() => onAnswer(q.id, opt.value)}
                    className="peer sr-only"
                  />
                  <span className="group/chip inline-flex min-h-12 items-center gap-2 rounded-md bg-paper px-4 text-sm font-semibold text-charcoal/80 shadow-[inset_0_0_0_1px_rgb(21_21_21/0.14)] transition-[background-color,box-shadow,color,transform] duration-300 hover:text-charcoal hover:shadow-[inset_0_0_0_1px_rgb(21_21_21/0.4)] active:translate-y-px peer-checked:bg-charcoal peer-checked:text-offwhite peer-checked:shadow-none peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-wood">
                    {answers[q.id] === opt.value && (
                      <Check aria-hidden="true" className="size-4 text-champagne" strokeWidth={2.5} />
                    )}
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <Button variant="dark" className="mt-10" fullWidth disabled={missing > 0} onClick={onDone}>
        Continuar
      </Button>
      <p className="mt-3 text-sm text-charcoal/55" aria-live="polite">
        {missing > 0
          ? `Falta${missing > 1 ? 'm' : ''} ${missing} resposta${missing > 1 ? 's' : ''}.`
          : 'Pronto. Agora é só dizer como falamos com você.'}
      </p>
    </div>
  );
}
