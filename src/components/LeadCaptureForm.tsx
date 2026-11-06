import { MessageCircle } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent, type InputHTMLAttributes, type Ref } from 'react';
import { answerLabel, emptyAnswers, scoreAnswers, type Answers } from '../config/qualification';
import { isLeadApiConfigured } from '../config/site';
import { getAttribution } from '../lib/attribution';
import { cn } from '../lib/cn';
import { formatCents, formatReais } from '../lib/money';
import { track } from '../lib/tracking';
import { maskPhoneBR, toE164BR, validateName, validatePhoneBR } from '../lib/validation';
import { simulationMessage, whatsappUrl } from '../lib/whatsapp';
import { submitLead } from '../services/leadService';
import type { SimulationSnapshot } from '../types';
import { usePrivacy } from './privacy/PrivacyContext';
import { QualificationStep } from './QualificationStep';
import { Button, ButtonLink } from './ui/Button';

interface Props {
  snapshot: SimulationSnapshot | null;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; sent: SimulationSnapshot; name: string }
  | { kind: 'demo'; sent: SimulationSnapshot; name: string };

type Field = 'name' | 'phone';

/** Campo com linha de base que se desenha no foco. */
function LineField({
  label,
  error,
  inputRef,
  className,
  ...props
}: { label: string; error?: string | null; inputRef: Ref<HTMLInputElement> } & InputHTMLAttributes<HTMLInputElement>) {
  const id = props.id!;
  return (
    <div>
      <label htmlFor={id} className="label text-charcoal/55">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          ref={inputRef}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
          className={cn(
            'peer h-14 w-full bg-transparent text-[1.15rem] font-semibold text-charcoal outline-none placeholder:font-medium placeholder:text-charcoal/30 md:text-xl',
            className,
          )}
        />
        <span aria-hidden="true" className={cn('absolute inset-x-0 bottom-0 h-px', error ? 'bg-alert-dark' : 'bg-charcoal/20')} />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-charcoal transition-transform duration-700 ease-[var(--ease-expo)] peer-focus:scale-x-100"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm font-medium text-alert-dark">
          {error}
        </p>
      )}
    </div>
  );
}

/** Marca de confirmação desenhada por traço. */
function DrawnMark({ demo }: { demo: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className="size-16 md:size-20" aria-hidden="true" fill="none">
      <circle
        cx="32"
        cy="32"
        r="30"
        stroke="currentColor"
        strokeWidth="1"
        pathLength={1}
        strokeDasharray={demo ? '0.02 0.03' : '1'}
        className={cn('text-wood', !demo && 'animate-draw')}
      />
      {demo ? (
        <path d="M22 32h20" stroke="currentColor" strokeWidth="1.5" className="text-wood" />
      ) : (
        <path
          d="M21 33l7 7 15-16"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          className="animate-draw text-charcoal [animation-delay:0.45s]"
        />
      )}
    </svg>
  );
}

export function LeadCaptureForm({ snapshot }: Props) {
  const id = useId();
  const { openPrivacy } = usePrivacy();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, phone: false });
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [step, setStep] = useState<'qualify' | 'contact'>('qualify');
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const errors: Record<Field, string | null> = { name: validateName(name), phone: validatePhoneBR(phone) };
  const shown = (f: Field) => (touched[f] ? errors[f] : null);

  useEffect(() => {
    if (status.kind === 'success' || status.kind === 'demo') resultHeadingRef.current?.focus();
  }, [status.kind]);

  const noun = snapshot?.planNoun ?? 'objetivo';

  const goToContact = () => {
    setStep('contact');
    requestAnimationFrame(() => {
      document.getElementById('cadastro')?.scrollIntoView({ block: 'start' });
      nameRef.current?.focus({ preventScroll: true });
    });
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ name: true, phone: true });
    if (errors.name) return nameRef.current?.focus();
    if (errors.phone) return phoneRef.current?.focus();
    if (!snapshot) return;

    setStatus({ kind: 'submitting' });
    const qualification = scoreAnswers(answers, snapshot.planNoun);
    const result = await submitLead({
      name,
      whatsapp: toE164BR(phone),
      simulation: snapshot,
      qualification: { answers, ...qualification },
      attribution: getAttribution(),
      honeypot,
    });

    if (result.status === 'success') {
      // Conversão disparada SOMENTE após confirmação do backend.
      track('lead_form_submitted', {
        plan: snapshot.planId,
        category: snapshot.category,
        monthly_budget: Number(snapshot.monthlyBudgetCents / 100n),
        credit_amount: Number(snapshot.creditCents / 100n),
        term_months: snapshot.termMonths,
        lead_temperature: qualification.temperature,
      });
      setStatus({ kind: 'success', sent: snapshot, name });
    } else if (result.status === 'demo') {
      setStatus({ kind: 'demo', sent: snapshot, name });
    } else {
      setStatus({ kind: 'error', message: result.message });
    }
  }

  const wrapper = 'grid grid-cols-1 gap-12 border-t border-charcoal/15 pt-12 md:pt-16 lg:grid-cols-12 lg:gap-x-12 animate-reveal-panel';

  if (status.kind === 'success' || status.kind === 'demo') {
    const demo = status.kind === 'demo';
    const firstName = status.name.trim().split(' ')[0];
    return (
      <div className={wrapper}>
        <div className="lg:col-span-5">
          <DrawnMark demo={demo} />
          {demo && <p className="label mt-6 text-wood">Modo demonstração</p>}
          <h3
            ref={resultHeadingRef}
            tabIndex={-1}
            className="display mt-6 text-[clamp(1.8rem,4vw,3.2rem)] text-charcoal outline-none"
          >
            {demo ? 'Cadastro não enviado: integração pendente.' : `Recebemos seus dados, ${firstName}.`}
          </h3>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 lg:self-end">
          <p className="max-w-lg leading-relaxed text-charcoal/70">
            {demo
              ? 'A API de cadastro ainda não foi conectada, por isso nenhum dado foi registrado. Quando a integração estiver ativa, esta tela confirma o recebimento real do cadastro.'
              : 'Um especialista vai entrar em contato pelo WhatsApp informado para apresentar as condições disponíveis. Se preferir, continue a conversa agora.'}
          </p>
          <p className="tabular mt-6 border-l border-copper pl-4 text-sm text-charcoal/55">
            {status.sent.planLabel}: {formatCents(status.sent.monthlyBudgetCents)} por mês, crédito estimado de{' '}
            {formatCents(status.sent.creditCents)} em {status.sent.termMonths} meses
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <ButtonLink
              href={whatsappUrl(simulationMessage(status.sent, status.name, answerLabel('timeframe', answers.timeframe, status.sent.planNoun)))}
              target="_blank"
              rel="noopener noreferrer"
              variant="dark"
              icon={MessageCircle}
              onClick={() => track('whatsapp_clicked', { location: 'lead_confirmation', plan: status.sent.planId })}
            >
              Continuar no WhatsApp
            </ButtonLink>
            <button
              type="button"
              onClick={() => {
                setStatus({ kind: 'idle' });
                if (!demo) {
                  setStep('qualify');
                  setAnswers(emptyAnswers());
                }
              }}
              className="link-draw inline-flex min-h-11 items-center self-start text-sm font-semibold text-charcoal/65 hover:text-charcoal sm:self-auto"
            >
              {demo ? 'Voltar ao formulário' : 'Enviar outra simulação'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const submitting = status.kind === 'submitting';

  return (
    <div className={wrapper}>
      <div className="lg:col-span-5">
        <h3 className="display text-[clamp(2rem,4.4vw,3.6rem)] text-charcoal">Gostou dessa possibilidade?</h3>
        <p className="mt-6 max-w-md leading-relaxed text-charcoal/65">
          {step === 'qualify'
            ? 'Responda quatro perguntas rápidas. Assim o especialista já chega com as opções certas para o seu caso.'
            : 'Deixe seus dados para receber mais informações e conversar com um especialista sobre as condições disponíveis.'}
        </p>
        <p className="mt-6 text-sm font-semibold text-wood">Passo {step === 'qualify' ? 1 : 2} de 2</p>

        {snapshot && (
          <dl className="mt-10 max-w-md border-t border-charcoal/15 text-sm">
            {[
              ['Objetivo', snapshot.planLabel],
              ['Cabe no seu mês', `R$ ${formatReais(Number(snapshot.monthlyBudgetCents / 100n))}`],
              ['Crédito estimado', `R$ ${formatReais(Number(snapshot.creditCents / 100n))}`],
              ['Prazo escolhido', `${snapshot.termMonths} meses`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between border-b border-charcoal/15 py-3">
                <dt className="text-charcoal/55">{k}</dt>
                <dd className="tabular font-semibold text-charcoal">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {step === 'qualify' ? (
        <div className="lg:col-span-6 lg:col-start-7">
          <QualificationStep
            noun={noun}
            answers={answers}
            onAnswer={(q, v) => setAnswers((a) => ({ ...a, [q]: v }))}
            onDone={goToContact}
          />
        </div>
      ) : (
      <form
        noValidate
        onSubmit={handleSubmit}
        aria-describedby={`${id}-purpose`}
        className="flex flex-col lg:col-span-6 lg:col-start-7 lg:self-end"
      >
        {!isLeadApiConfigured && <p className="label mb-8 text-wood">Modo demonstração: nenhum dado é enviado.</p>}

        <div className="space-y-8">
          <LineField
            inputRef={nameRef}
            id={`${id}-name`}
            label="Nome"
            name="name"
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            placeholder="Como podemos te chamar?"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            error={shown('name')}
          />
          <LineField
            inputRef={phoneRef}
            id={`${id}-phone`}
            label="WhatsApp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            enterKeyHint="send"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            error={shown('phone')}
            className="tabular"
          />

          {/* Campo isca anti-spam: invisível para pessoas */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Não preencha
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </label>
          </div>
        </div>

        {!snapshot && (
          <p className="mt-6 text-sm font-medium text-alert-dark" role="status">
            Ajuste a simulação para um valor válido antes de enviar.
          </p>
        )}

        {status.kind === 'error' && (
          <p className="mt-6 border-l-2 border-alert-dark pl-4 text-sm text-charcoal" role="alert">
            {status.message}
          </p>
        )}

        <Button
          type="submit"
          variant="dark"
          className="mt-10"
          fullWidth
          disabled={submitting || !snapshot}
          loading={submitting}
        >
          {submitting ? 'Enviando…' : 'Quero receber mais informações'}
        </Button>

        <p id={`${id}-purpose`} className="mt-5 text-[0.8rem] leading-relaxed text-charcoal/55">
          Usamos seu nome, WhatsApp e respostas apenas para retornar o contato sobre esta simulação. Não pedimos CPF,
          documentos ou renda.{' '}
          <button
            type="button"
            onClick={openPrivacy}
            className="inline-flex min-h-11 items-center align-middle font-semibold text-wood underline decoration-wood/40 underline-offset-2 hover:decoration-wood"
          >
            Aviso de privacidade
          </button>
        </p>
        <button
          type="button"
          onClick={() => setStep('qualify')}
          className="link-draw mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold text-charcoal/60 hover:text-charcoal"
        >
          Voltar às perguntas
        </button>
      </form>
      )}
    </div>
  );
}
