import { useCallback, useEffect, useRef, useState } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PrivacyProvider } from './components/privacy/PrivacyContext';
import { initialContact, type ContactDraft } from './components/funnel/ContactStep';
import { initialValues, type ValuesDraft } from './components/funnel/ValuesStep';
import { ResultPage, ZONE_COLOR } from './components/ResultPage';
import { captureAttribution, getAttribution } from './lib/attribution';
import { evaluate } from './lib/feasibility';
import { scrollToId } from './lib/scroll';
import { initTracking, track } from './lib/tracking';
import { gsap } from './motion/gsap';
import { submitLead } from './services/leadService';
import type { Contact, SimulationResult } from './types';

const RESULT_PATH = '/resultado';
const ZONE_WORD = { quente: 'Quente', morno: 'Morna', frio: 'Fria' } as const;
/** Tempo máximo esperando a API antes de abrir o resultado (o envio segue em segundo plano). */
const SUBMIT_WAIT_MS = 4000;
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Duas páginas: o formulário (valores → contato → Simular) e o resultado em /resultado,
 * onde a zona de calor e a conversa pelo WhatsApp ganham a tela inteira.
 */
export default function App() {
  const [page, setPage] = useState<'form' | 'result'>('form');
  const [step, setStep] = useState<'values' | 'contact'>('values');
  const [values, setValues] = useState<ValuesDraft>(initialValues);
  const [draft, setDraft] = useState<ContactDraft>(initialContact);
  const [contact, setContact] = useState<Contact | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const started = useRef(false);
  const resultRef = useRef<SimulationResult | null>(null);
  const curtain = useRef<HTMLDivElement>(null);

  useEffect(() => {
    captureAttribution();
    initTracking();
    // Abrir /resultado direto (sem simulação) volta ao formulário.
    if (window.location.pathname === RESULT_PATH) window.history.replaceState(null, '', '/' + window.location.search);
    track('page_view', { page_path: '/' });
  }, []);

  // Botão "voltar" do celular: do resultado de volta ao formulário (e "avançar" de novo).
  useEffect(() => {
    const onPop = () => {
      const toResult = window.location.pathname === RESULT_PATH && !!resultRef.current;
      setPage(toResult ? 'result' : 'form');
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const changeValues = useCallback((patch: Partial<ValuesDraft>) => {
    if (!started.current) {
      started.current = true;
      track('simulation_started', {});
    }
    setValues((v) => ({ ...v, ...patch }));
  }, []);

  const changeDraft = useCallback((patch: Partial<ContactDraft>) => setDraft((d) => ({ ...d, ...patch })), []);

  const goToStep = useCallback((next: 'values' | 'contact') => {
    setStep(next);
    requestAnimationFrame(() => scrollToId('inicio', next === 'contact' ? 'input[name="name"]' : undefined));
  }, []);
  /** Troca de página por trás da cortina. */
  const openResult = useCallback(() => {
    const r = resultRef.current;
    if (!r) return;
    setPage('result');
    window.history.pushState({ page: 'result' }, '', RESULT_PATH + window.location.search);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    track('result_viewed', { heat_zone: r.feasibility.zone });
  }, []);

  const focusResultTitle = () =>
    requestAnimationFrame(() => document.getElementById('resultado-title')?.focus({ preventScroll: true }));

  /** "Teletransporte": cortina na cor da zona cobre a tela, troca a página e se abre. */
  const teleport = useCallback(() => {
    const r = resultRef.current;
    const el = curtain.current;
    if (!r) return;
    if (!el || reduceMotion()) {
      openResult();
      focusResultTitle();
      return;
    }
    const zone = r.feasibility.zone;
    el.style.backgroundColor = ZONE_COLOR[zone];
    const word = el.querySelector<HTMLElement>('[data-curtain-word]');
    if (word) word.textContent = ZONE_WORD[zone];

    gsap
      .timeline()
      .set(el, { display: 'grid', transformOrigin: '50% 100%', scaleY: 0 })
      .to(el, { scaleY: 1, duration: 0.6, ease: 'expo.inOut' })
      .fromTo(word, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: 'expo.out' }, 0.35)
      .add(openResult)
      .set(el, { transformOrigin: '50% 0%' }, '+=0.35')
      .to(word, { yPercent: -60, opacity: 0, duration: 0.4, ease: 'expo.in' })
      .to(el, { scaleY: 0, duration: 0.75, ease: 'expo.inOut' }, '<0.1')
      .set(el, { display: 'none' })
      .add(focusResultTitle);
  }, [openResult]);

  /**
   * Simular: calcula, envia o lead uma única vez (valores + contato) e abre o
   * resultado. A conversão só é registrada após a confirmação da API.
   */
  const simulate = useCallback(
    async (c: Contact, hp: string) => {
      if (values.monthly === null || values.credit === null) return;
      const feasibility = evaluate({
        planId: values.planId,
        monthlyReais: values.monthly,
        creditReais: values.credit,
        termMonths: values.term,
      });
      const r: SimulationResult = { id: Date.now(), feasibility, simulatedAt: new Date().toISOString() };
      resultRef.current = r;
      setResult(r);
      setContact(c);
      setHoneypot(hp);
      track('simulation_completed', {
        plan_id: feasibility.request.planId,
        heat_zone: feasibility.zone,
        fits: feasibility.fits,
        term_months: feasibility.request.termMonths,
      });

      const send = submitLead({
        stage: 'simulation',
        contact: c,
        simulation: { feasibility, simulatedAt: r.simulatedAt },
        attribution: getAttribution(),
        honeypot: hp,
      }).then((res) => {
        if (res.status === 'success') {
          track('lead_form_submitted', { plan_id: feasibility.request.planId, heat_zone: feasibility.zone });
          setContact((prev) => (prev ? { ...prev, leadId: res.leadId, synced: true } : prev));
        }
      });
      // Não prende a pessoa: no máximo alguns segundos e o resultado abre.
      await Promise.race([send, new Promise((ok) => window.setTimeout(ok, SUBMIT_WAIT_MS))]);
      teleport();
    },
    [values, teleport],
  );

  /** Refazer: volta ao primeiro passo com os valores preenchidos. */
  const restart = useCallback(() => {
    if (window.history.state?.page === 'result') window.history.back();
    else setPage('form');
    setStep('values');
    window.setTimeout(() => scrollToId('inicio', 'input[name="monthly"]'), 60);
  }, []);

  return (
    <PrivacyProvider>
      <Header />
      <main>
        {/* O formulário fica montado (só escondido) para preservar o que a pessoa preencheu. */}
        <div hidden={page !== 'form'}>
          <Hero
            step={step}
            values={values}
            contact={draft}
            onValues={changeValues}
            onContact={changeDraft}
            onStep={goToStep}
            onSimulate={simulate}
          />
        </div>
        {page === 'result' && result && (
          <ResultPage key={result.id} result={result} contact={contact} honeypot={honeypot} onRestart={restart} />
        )}
      </main>
      <Footer />

      {/* Cortina do teletransporte */}
      <div ref={curtain} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] hidden place-items-center">
        <span className="line-mask">
          <span data-curtain-word className="display block text-[clamp(4rem,20vw,12rem)] text-charcoal" />
        </span>
      </div>
    </PrivacyProvider>
  );
}
