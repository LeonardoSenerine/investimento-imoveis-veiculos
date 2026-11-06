import { useId, useState } from 'react';
import { FAQ as ITEMS } from '../content/faq';
import { cn } from '../lib/cn';
import { track } from '../lib/tracking';
import { whatsappUrl } from '../lib/whatsapp';
import { TextArrow } from './ui/Button';
import { Label, Lines } from './ui/Type';

/** Sinal de + que vira − com rotação das hastes. */
function Toggle({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="relative size-5 shrink-0">
      <span className="absolute left-0 top-1/2 h-px w-full bg-current" />
      <span
        className={cn(
          'absolute left-0 top-1/2 h-px w-full bg-current transition-transform duration-700 ease-[var(--ease-expo)]',
          open ? 'rotate-0' : 'rotate-90',
        )}
      />
    </span>
  );
}

export function FAQ() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="duvidas" aria-labelledby="duvidas-title" className="on-light bg-offwhite py-28 text-charcoal md:py-44">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-14 px-5 md:px-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <Label index="04" tone="light">
              Dúvidas
            </Label>
            <h2
              id="duvidas-title"
              data-reveal="lines"
              className="display mt-6 text-[clamp(2.5rem,10vw,3.4rem)] md:text-[clamp(3rem,4.6vw,4.6rem)]"
            >
              <Lines lines={['Antes de', 'decidir,', <span key="e" className="text-wood">entenda.</span>]} />
            </h2>
            <p className="mt-6 max-w-xs leading-relaxed text-charcoal/60">
              Respostas diretas sobre como o consórcio funciona — sem promessas.
            </p>
            <a
              href={whatsappUrl('Olá! Tenho uma dúvida sobre consórcio.')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_clicked', { location: 'faq' })}
              className="group mt-8 inline-block text-charcoal"
            >
              <TextArrow>Perguntar pelo WhatsApp</TextArrow>
            </a>
          </div>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            const btnId = `${baseId}-q${i}`;
            const panelId = `${baseId}-a${i}`;
            return (
              <div key={item.q} className="relative border-t border-charcoal/15 last:border-b">
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -top-px left-0 h-px bg-copper transition-[width] duration-700 ease-[var(--ease-expo)]',
                    isOpen ? 'w-full' : 'w-0',
                  )}
                />
                <h3>
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-2 py-6 text-left md:grid-cols-[4rem_1fr_auto] md:py-8"
                  >
                    <span className={cn('tabular text-xs font-semibold transition-colors', isOpen ? 'text-wood' : 'text-charcoal/35')}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'font-display text-[1.08rem] font-semibold leading-snug tracking-[-0.02em] transition-colors duration-500 md:text-[1.45rem]',
                        isOpen ? 'text-charcoal' : 'text-charcoal/70 group-hover:text-charcoal',
                      )}
                    >
                      {item.q}
                    </span>
                    <span className={cn('self-center transition-colors', isOpen ? 'text-charcoal' : 'text-charcoal/45 group-hover:text-charcoal')}>
                      <Toggle open={isOpen} />
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-700 ease-[var(--ease-expo)]',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                  {...(!isOpen && { inert: '' as unknown as boolean })}
                >
                  <div className="overflow-hidden">
                    <div className="max-w-2xl space-y-3 pb-8 pl-[2.5rem] pr-8 leading-relaxed text-charcoal/70 md:pl-[4rem]">
                      {item.a.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
