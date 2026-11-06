import { useEffect, useState } from 'react';

const isTypingField = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.matches('textarea, select') ||
    (el instanceof HTMLInputElement && !['radio', 'checkbox', 'range', 'button', 'submit'].includes(el.type)));

/**
 * `true` enquanto a pessoa digita em um campo. No celular o teclado ocupa
 * metade da tela: elementos fixos (CTA, WhatsApp) devem sair da frente.
 */
export function useTypingFocus() {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    let timer = 0;
    const onIn = (e: FocusEvent) => setTyping(isTypingField(e.target));
    // Adia a leitura: ao trocar de um campo para outro, o novo foco ainda não chegou.
    const onOut = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTyping(isTypingField(document.activeElement)), 0);
    };
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);
  return typing;
}
