const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function scrollToId(id: string, focusSelector?: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  if (focusSelector) {
    window.setTimeout(() => {
      el.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
    }, prefersReducedMotion() ? 0 : 550);
  }
}
