import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
import { PrivacyNotice } from './PrivacyNotice';

const PrivacyCtx = createContext<{ openPrivacy: () => void }>({ openPrivacy: () => {} });

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openPrivacy = useCallback(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <PrivacyCtx.Provider value={{ openPrivacy }}>
      {children}
      <PrivacyNotice ref={dialogRef} />
    </PrivacyCtx.Provider>
  );
}

export const usePrivacy = () => useContext(PrivacyCtx);
