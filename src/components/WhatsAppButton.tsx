import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useScrollPast } from '../hooks/useScrollPast';
import { useTypingFocus } from '../hooks/useTypingFocus';
import { cn } from '../lib/cn';
import { track } from '../lib/tracking';
import { whatsappUrl } from '../lib/whatsapp';
import { ButtonLink } from './ui/Button';

/** `true` enquanto o simulador ou o CTA final estiverem na tela (o CTA móvel seria redundante). */
function useConversionAreaVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const targets = ['simulador', 'cta-final']
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!targets.length || typeof IntersectionObserver === 'undefined') return;
    const onScreen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) onScreen.add(e.target);
          else onScreen.delete(e.target);
        }
        setVisible(onScreen.size > 0);
      },
      { threshold: 0.05 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return visible;
}

/** WhatsApp flutuante discreto + CTA fixo de simulação no celular. */
export function WhatsAppButton() {
  const pastHero = useScrollPast(0.85);
  const conversionVisible = useConversionAreaVisible();
  const typing = useTypingFocus();
  const showMobileCta = pastHero && !conversionVisible && !typing;
  const showWhatsApp = pastHero && !typing;

  return (
    <>
      <div
        className={cn(
          'fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 right-[4.75rem] z-30 transition-[transform,opacity] duration-700 ease-[var(--ease-expo)] md:hidden',
          showMobileCta ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[130%] opacity-0',
        )}
        aria-hidden={!showMobileCta}
      >
        <ButtonLink
          href="#simulador"
          size="md"
          fullWidth
          tabIndex={showMobileCta ? 0 : -1}
          className="shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)]"
        >
          Ver quanto cabe no meu mês
        </ButtonLink>
      </div>

      <a
        href={whatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar pelo WhatsApp"
        onClick={() => track('whatsapp_clicked', { location: 'floating_button' })}
        tabIndex={showWhatsApp ? 0 : -1}
        className={cn(
          'group fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-3 z-30 grid size-12 place-items-center rounded-full bg-graphite text-champagne shadow-[inset_0_0_0_1px_rgb(217_166_111/0.35),0_18px_40px_-12px_rgb(0_0_0/0.7)] transition-[transform,opacity,background-color] duration-700 ease-[var(--ease-expo)] hover:bg-charcoal md:bottom-8 md:right-8 md:size-14',
          showWhatsApp ? 'scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0',
        )}
      >
        <MessageCircle className="size-5 transition-transform duration-500 group-hover:-rotate-12 md:size-6" strokeWidth={1.5} />
        <span className="label pointer-events-none absolute right-full mr-4 hidden translate-x-2 whitespace-nowrap bg-offwhite px-4 py-2.5 !text-[0.62rem] text-charcoal opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:block">
          Fale com um especialista
        </span>
      </a>
    </>
  );
}
