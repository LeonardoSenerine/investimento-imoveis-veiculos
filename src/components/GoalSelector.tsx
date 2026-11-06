import type { ReactNode } from 'react';
import { IMAGES, type StockImage as Img } from '../config/images';
import { PLANS, type Category, type VehicleKind } from '../config/simulators';
import { cn } from '../lib/cn';
import { formatReaisShort } from '../lib/money';
import { Button } from './ui/Button';
import { StockImage } from './ui/StockImage';
import { Words } from './ui/Type';

interface Props {
  onSelect: (category: Category, vehicleKind?: VehicleKind) => void;
}

/** Fotografia com máscara de revelação, parallax interno e zoom contido no hover. */
function Photo({ image, sizes, className, children }: { image: Img; sizes: string; className?: string; children?: ReactNode }) {
  return (
    <div data-reveal="image" className={cn('relative overflow-hidden bg-graphite', className)}>
      <div data-parallax="7" className="absolute inset-x-0 -top-[9%] h-[118%]">
        <StockImage
          image={image}
          sizes={sizes}
          widths={[640, 960, 1280, 1600, 2048, 2560]}
          quality={84}
          className="h-full w-full object-cover transition-transform duration-[1800ms] ease-[var(--ease-expo)] group-hover:scale-[1.045]"
        />
      </div>
      {children}
    </div>
  );
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-8 border-t border-offwhite/12">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 border-b border-offwhite/12 py-3 text-sm">
          <dt className="text-offwhite/50">{k}</dt>
          <dd className="tabular font-semibold text-offwhite">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function GoalSelector({ onSelect }: Props) {
  const { imovel, automovel, moto } = PLANS;

  return (
    <section id="objetivo" aria-labelledby="objetivo-title" className="relative bg-charcoal pb-28 pt-24 md:pb-44 md:pt-40">
      <div className="mx-auto max-w-[90rem] px-5 md:px-10">
        {/* Manifesto: as palavras acendem no ritmo da leitura */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          <h2
            id="objetivo-title"
            data-reveal="words"
            className="font-display text-[clamp(1.45rem,3.3vw,3rem)] font-medium leading-[1.16] tracking-[-0.025em] text-offwhite md:col-span-10 md:col-start-3"
          >
            <Words
              text="Comprar com planejamento muda tudo. Você escolhe o objetivo, descobre quanto cabe no seu mês e decide no seu tempo, com orientação em cada etapa." 
            />
          </h2>
        </div>

        {/* Capítulo Imóveis: foto larga à esquerda, palavra cruzando a borda inferior */}
        <article className="group relative mt-24 grid grid-cols-1 md:mt-40 md:grid-cols-12 md:gap-x-10">
          <div className="relative md:col-span-8">
            <Photo image={IMAGES.property} sizes="(min-width: 768px) 62vw, 100vw" className="aspect-[4/5] md:aspect-[16/11]">
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-transparent via-45% to-charcoal/25" />
            </Photo>
            <span
              aria-hidden="true"
              className="display pointer-events-none absolute -bottom-[0.5em] left-3 text-[clamp(3.6rem,14vw,11rem)] text-offwhite md:left-8"
            >
              Imóveis
            </span>
          </div>

          <div className="pt-24 md:col-span-4 md:self-end md:pt-0">
            <h3 className="font-display text-[clamp(1.6rem,2.6vw,2.4rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-offwhite">
              Planeje a conquista do seu imóvel.
            </h3>
            <p className="mt-4 max-w-sm leading-relaxed text-offwhite/60">
              Crédito para imóvel residencial ou comercial, terreno ou construção, conforme as regras do contrato.
            </p>
            <Facts
              rows={[
                ['Prazos', `${Math.min(...imovel.termOptions)} a ${Math.max(...imovel.termOptions)} meses`],
                ['Faixa no simulador', `${formatReaisShort(imovel.credit.min)} a ${formatReaisShort(imovel.credit.max)}`],
              ]}
            />
            <Button
              variant="outline"
              icon={false}
              fullWidth
              className="z-[6] mt-8"
              onClick={() => onSelect('property')}
            >
              Planejar meu imóvel
            </Button>
          </div>
          {/* Área clicável do capítulo inteiro (o botão acima continua sendo o alvo acessível) */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 z-[5] cursor-pointer"
            onClick={() => onSelect('property')}
          />
        </article>

        {/* Capítulo Veículos: espelhado, palavra cruzando a borda superior */}
        <article className="group relative mt-32 grid grid-cols-1 md:mt-52 md:grid-cols-12 md:gap-x-10">
          <div className="relative md:order-2 md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-7">
            <span
              aria-hidden="true"
              className="display pointer-events-none absolute -top-[0.42em] right-3 z-10 text-[clamp(3.6rem,14vw,11rem)] text-offwhite md:right-8"
            >
              Veículos
            </span>
            <Photo image={IMAGES.vehicle} sizes="(min-width: 768px) 45vw, 100vw" className="aspect-[4/5]">
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-charcoal/35 via-transparent via-40% to-charcoal/60" />
            </Photo>

            {/* Fotografia sobreposta: a motocicleta avança sobre a borda e se move em outra velocidade */}
            <div className="absolute left-4 top-[68%] z-10 w-[40%] md:left-6 md:top-[64%] md:w-[34%] lg:-left-[18%] lg:w-[40%]">
              <div data-parallax="-10">
                <figure className="relative shadow-[0_0_0_6px_#151515] md:shadow-[0_0_0_10px_#151515]">
                  <Photo image={IMAGES.motorcycle} sizes="(min-width: 768px) 20vw, 40vw" className="aspect-[3/4]" />
                  <figcaption className="label absolute bottom-3 left-3 text-offwhite/90 md:bottom-4 md:left-4">
                    Motocicletas
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>

          <div className="pt-28 md:order-1 md:col-span-5 md:self-end md:pt-0 lg:col-span-4 lg:col-start-2">
            <h3 className="font-display text-[clamp(1.6rem,2.6vw,2.4rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-offwhite">
              Encontre uma possibilidade para seu próximo veículo.
            </h3>

            {/* Escolha direta do tipo em linhas, não em cards */}
            <ul className="mt-8 border-t border-offwhite/12">
              {(
                [
                  [automovel, `A partir de ${formatReaisShort(automovel.credit.min)}`],
                  [moto, `Até ${formatReaisShort(moto.credit.max)}`],
                ] as const
              ).map(([plan, range]) => (
                <li key={plan.id} className="border-b border-offwhite/12">
                  <button
                    type="button"
                    onClick={() => onSelect('vehicle', plan.id as VehicleKind)}
                    className="group/row relative flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -top-px left-0 h-px w-0 bg-champagne transition-[width] duration-700 ease-[var(--ease-expo)] group-hover/row:w-full"
                    />
                    <span>
                      <span className="block font-display text-lg font-semibold text-offwhite transition-colors group-hover/row:text-champagne">
                        {plan.label}
                      </span>
                      <span className="tabular mt-0.5 block text-sm text-offwhite/50">
                        {range}, prazos de {Math.min(...plan.termOptions)} a {Math.max(...plan.termOptions)} meses
                      </span>
                    </span>
                    <span className="link-draw text-sm font-semibold text-offwhite/60 transition-colors group-hover/row:text-champagne">
                      Simular
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <Button variant="outline" icon={false} fullWidth className="mt-8" onClick={() => onSelect('vehicle')}>
              Planejar meu veículo
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
