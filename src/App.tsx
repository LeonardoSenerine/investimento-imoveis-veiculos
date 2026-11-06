import { useCallback, useEffect, useState } from 'react';
import { FAQ } from './components/FAQ';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { GoalSelector } from './components/GoalSelector';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { PrivacyProvider } from './components/privacy/PrivacyContext';
import { SimulatorSection } from './components/simulator/SimulatorSection';
import { WhatsAppButton } from './components/WhatsAppButton';
import type { Category, VehicleKind } from './config/simulators';
import { captureAttribution } from './lib/attribution';
import { scrollToId } from './lib/scroll';
import { initTracking, track } from './lib/tracking';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useScrollReveals } from './motion/useScrollReveals';
import type { GoalSelection } from './types';

export default function App() {
  const [goal, setGoal] = useState<GoalSelection | null>(null);
  // Tráfego pago chega pelo celular: lá o simulador vem logo após o hero.
  const mobile = useMediaQuery('(max-width: 767px)');

  useScrollReveals();

  useEffect(() => {
    captureAttribution();
    initTracking();
    track('page_view', { page_path: window.location.pathname });
  }, []);

  const selectGoal = useCallback((category: Category, vehicleKind?: VehicleKind) => {
    setGoal({ category, vehicleKind, nonce: Date.now() });
    requestAnimationFrame(() => scrollToId('simulador'));
  }, []);

  return (
    <PrivacyProvider>
      <a
        href="#simulador"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-champagne focus:px-5 focus:py-3 focus:font-semibold focus:text-charcoal"
      >
        Ir para o simulador
      </a>
      <Header />
      <main>
        <Hero />
        {mobile ? (
          <>
            <SimulatorSection key="sim" goal={goal} />
            <GoalSelector key="goals" onSelect={selectGoal} />
          </>
        ) : (
          <>
            <GoalSelector key="goals" onSelect={selectGoal} />
            <SimulatorSection key="sim" goal={goal} />
          </>
        )}
        <HowItWorks />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </PrivacyProvider>
  );
}
