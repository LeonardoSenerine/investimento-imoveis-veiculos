import { isLeadApiConfigured, isWhatsAppConfigured } from '../config/site';
import { usePrivacy } from './privacy/PrivacyContext';

/** Rodapé mínimo: aviso de privacidade (LGPD) e crédito. */
export function Footer() {
  const { openPrivacy } = usePrivacy();
  const pending = [!isLeadApiConfigured && 'API de cadastro', !isWhatsAppConfigured && 'número de WhatsApp'].filter(Boolean);

  return (
    <footer className="bg-charcoal pb-[calc(1rem+env(safe-area-inset-bottom))] text-xs text-offwhite/45">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-x-6 border-t border-offwhite/10 px-5 py-2 md:px-10">
        <button type="button" onClick={openPrivacy} className="link-draw inline-flex min-h-11 items-center hover:text-offwhite">
          Aviso de privacidade
        </button>
        <p>
          Desenvolvido por{' '}
          <a
            href="https://www.senerinedev.com.br/pt"
            target="_blank"
            rel="noopener"
            className="link-draw inline-flex min-h-11 items-center font-semibold text-offwhite/75 hover:text-champagne"
          >
            senerine.dev
          </a>
        </p>
        {pending.length > 0 && (
          <p className="w-full pb-2 text-champagne/80">Modo demonstração: configure {pending.join(' e ')}.</p>
        )}
      </div>
    </footer>
  );
}
