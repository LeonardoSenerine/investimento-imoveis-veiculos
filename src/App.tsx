import { useCallback, useEffect, useRef, useState } from 'react';
import { Footer } from './components/Footer';
import { initialDraft, type FormDraft, type FormSubmit } from './components/funnel/LeadForm';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PrivacyProvider } from './components/privacy/PrivacyContext';
import { ResultPage } from './components/ResultPage';
import { OBJECTIVES } from './config/simulators';
import { captureAttribution, getAttribution } from './lib/attribution';
import { quote } from './lib/calculator';
import { scrollToId } from './lib/scroll';
import { initTracking, track } from './lib/tracking';
import { gsap } from './motion/gsap';
import { submitLead } from './services/leadService';
import type { Contact, SimulationResult } from './types';

const RESULT_PATH = '/resultado';
/** Tempo máximo esperando a API antes de abrir o resultado (o envio segue em segundo plano). */
const SUBMIT_WAIT_MS = 4000;
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Duas páginas: o formulário em etapa única (`/`) e o resultado em /resultado,
 * com a parcela e o contato do consultor em destaque.
 */
export default function App() {
  const [page, setPage] = useState<'form' | 'result'>('form');
  const [draft, setDraft] = useState<FormDraft>(initialDraft);
  const [contact, setContact] = useState<Contact | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const resultRef = useRef<SimulationResult | null>(null);
  const started = useRef(false);
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

  const changeDraft = useCallback((patch: Partial<FormDraft>) => {
    if (!started.current) {
      started.current = true;
      track('simulation_started', {});
    }
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  /** Troca de página por trás da cortina. */
  const openResult = useCallback(() => {
    const r = resultRef.current;
    if (!r) return;
    setPage('result');
    window.history.pushState({ page: 'result' }, '', RESULT_PATH + window.location.search);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    track('result_viewed', { objective: r.quote.objective, rule: r.quote.rule.id });
  }, []);

  const focusResultTitle = () =>
    requestAnimationFrame(() => document.getElementById('resultado-title')?.focus({ preventScroll: true }));

  /** Transição: uma cortina cobre a tela com o objetivo, troca a página e se abre. */
  const reveal = useCallback(() => {
    const r = resultRef.current;
    const el = curtain.current;
    if (!r) return;
    if (!el || reduceMotion()) {
      openResult();
      focusResultTitle();
      return;
    }
    const word = el.querySelector<HTMLElement>('[data-curtain-word]');
    if (word) word.textContent = OBJECTIVES[r.quote.objective].label;

    gsap
      .timeline()
      .set(el, { display: 'grid', transformOrigin: '50% 100%', scaleY: 0 })
      .to(el, { scaleY: 1, duration: 0.6, ease: 'expo.inOut' })
      .fromTo(word, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: 'expo.out' }, 0.35)
      .add(openResult)
      .set(el, { transformOrigin: '50% 0%' }, '+=0.3')
      .to(word, { yPercent: -60, opacity: 0, duration: 0.4, ease: 'expo.in' })
      .to(el, { scaleY: 0, duration: 0.75, ease: 'expo.inOut' }, '<0.1')
      .set(el, { display: 'none' })
      .add(focusResultTitle);
  }, [openResult]);

  /**
   * Ver meu resultado: calcula, envia o lead uma única vez e abre o resultado.
   * A conversão só é registrada após a confirmação da API.
   */
  const simulate = useCallback(
    async ({ objective, valueReais, profile, contact: c, honeypot: hp }: FormSubmit) => {
      const q = quote(objective, valueReais);
      const r: SimulationResult = { id: Date.now(), quote: q, profile, simulatedAt: new Date().toISOString() };
      resultRef.current = r;
      setResult(r);
      setContact(c);
      setHoneypot(hp);
      track('simulation_completed', { objective, rule: q.rule.id, term_months: q.termMonths, has_savings: profile.hasSavings });

      const send = submitLead({ contact: c, result: r, attribution: getAttribution(), honeypot: hp }).then((res) => {
        if (res.status === 'success') {
          track('lead_form_submitted', { objective, rule: q.rule.id });
          setContact((prev) => (prev ? { ...prev, leadId: res.leadId, synced: true } : prev));
        }
      });
      // Não prende a pessoa: no máximo alguns segundos e o resultado abre.
      await Promise.race([send, new Promise((ok) => window.setTimeout(ok, SUBMIT_WAIT_MS))]);
      reveal();
    },
    [reveal],
  );

  /** Refazer: volta ao formulário com os dados preenchidos. */
  const restart = useCallback(() => {
    if (window.history.state?.page === 'result') window.history.back();
    else setPage('form');
    window.setTimeout(() => scrollToId('inicio', 'input[name="value"]'), 60);
  }, []);

  return (
    <PrivacyProvider>
      <Header />
      <main>
        {/* O formulário fica montado (só escondido) para preservar o que a pessoa preencheu. */}
        <div hidden={page !== 'form'}>
          <Hero draft={draft} onChange={changeDraft} onSubmit={simulate} />
        </div>
        {page === 'result' && result && (
          <ResultPage key={result.id} result={result} contact={contact} honeypot={honeypot} onRestart={restart} />
        )}
      </main>
      <Footer />

      {/* Cortina da transição para o resultado */}
      <div ref={curtain} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] hidden place-items-center bg-champagne">
        <span className="line-mask">
          <span data-curtain-word className="display block text-[clamp(2.75rem,13vw,10rem)] text-charcoal" />
        </span>
      </div>
    </PrivacyProvider>
  );
}
