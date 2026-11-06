import { IMAGES } from '../config/images';
import { SITE, isLeadApiConfigured, isWhatsAppConfigured } from '../config/site';
import { usePrivacy } from './privacy/PrivacyContext';
import { StockImage } from './ui/StockImage';

export function Footer() {
  const { openPrivacy } = usePrivacy();
  const pending = [!isLeadApiConfigured && 'API de cadastro', !isWhatsAppConfigured && 'número de WhatsApp'].filter(
    Boolean,
  );

  return (
    <footer className="relative isolate overflow-hidden bg-charcoal pb-28 pt-16 text-offwhite/50 md:pb-12 md:pt-20">
      {/* Textura de mármore quase imperceptível */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.24]">
        <StockImage image={IMAGES.marble} widths={[640, 1280, 1920]} sizes="100vw" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal/60 to-charcoal/30" />
      </div>
      <div className="mx-auto max-w-[90rem] px-5 md:px-10">
        <div className="grid grid-cols-1 gap-10 border-t border-offwhite/10 pt-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-display text-base font-semibold text-offwhite">{SITE.descriptor}</p>
            <p className="mt-1 text-sm">{SITE.descriptorDetail}</p>
          </div>
          <nav aria-label="Rodapé" className="md:col-span-4">
            <ul className="grid grid-cols-2 gap-y-3 text-sm">
              <li><a href="#simulador" className="link-draw hover:text-offwhite">Simulador</a></li>
              <li><a href="#como-funciona" className="link-draw hover:text-offwhite">Como funciona</a></li>
              <li><a href="#duvidas" className="link-draw hover:text-offwhite">Dúvidas</a></li>
              <li>
                <button type="button" onClick={openPrivacy} className="link-draw hover:text-offwhite">
                  Aviso de privacidade
                </button>
              </li>
            </ul>
          </nav>
          <p className="text-xs leading-relaxed md:col-span-4">
            Este site é mantido por um consultor comercial independente e não pertence a uma administradora. Os
            planos de consórcio apresentados são administrados por administradoras autorizadas pelo Banco Central do
            Brasil. As simulações são
            ilustrativas e não representam proposta, oferta ou garantia de contemplação.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-3 text-xs md:flex-row md:items-center md:justify-between md:pr-20">
          <p>© {new Date().getFullYear()}. Fotografias: Unsplash.</p>
          {pending.length > 0 && (
            <p className="label text-champagne">Modo demonstração: configure {pending.join(' e ')}.</p>
          )}
        </div>
      </div>
    </footer>
  );
}
