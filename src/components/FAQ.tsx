import { useId, useState } from 'react';
import { FAQ as ITEMS } from '../content/faq';
import { cn } from '../lib/cn';
import { track } from '../lib/tracking';
import { whatsappUrl } from '../lib/whatsapp';
import { Lines } from './ui/Type';

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
            <h2
              id="duvidas-title"
              data-reveal="lines"
              className="display text-[clamp(2.2rem,9.4vw,3rem)] md:text-[clamp(2.6rem,4vw,4rem)]"
            >
              <Lines lines={['Dúvidas', 'frequentes']} />
            </h2>
            <p className="mt-6 max-w-xs leading-relaxed text-charcoal/60">
              Tudo o que você precisa saber antes de decidir, sem promessas.
            </p>
            <a
              href={whatsappUrl('Olá! Vim pelo site e tenho uma dúvida sobre o planejamento.')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_clicked', { location: 'faq' })}
              className="group mt-6 inline-flex min-h-11 items-center text-charcoal"
            >
              <span className="link-draw pb-0.5 font-semibold">Perguntar pelo WhatsApp</span>
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
                    className="group grid w-full grid-cols-[1fr_auto] items-baseline gap-x-6 py-6 text-left md:py-8"
                  >
                    <span
                      className={cn(
                        'font-display text-[1.05rem] font-semibold leading-snug tracking-[-0.015em] transition-colors duration-500 md:text-[1.35rem]',
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
                    <div className="max-w-2xl space-y-3 pb-8 pr-8 leading-relaxed text-charcoal/70">
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
