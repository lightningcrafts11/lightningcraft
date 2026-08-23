'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type MobilePanel = 'components' | 'properties' | null;

interface MobilePanelsContextValue {
  panel: MobilePanel;
  openPanel: (panel: Exclude<MobilePanel, null>) => void;
  closePanel: () => void;
  togglePanel: (panel: Exclude<MobilePanel, null>) => void;
}

const MobilePanelsContext = createContext<MobilePanelsContextValue | null>(null);

/** SSR assumes desktop so the 3-column markup hydrates without a flash. */
export function useDesktopLayout(): boolean {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

export function useMobilePanels(): MobilePanelsContextValue {
  const value = useContext(MobilePanelsContext);
  if (!value) {
    throw new Error('useMobilePanels must be used within MobilePanelsProvider');
  }
  return value;
}

export function MobilePanelsProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<MobilePanel>(null);

  const closePanel = useCallback(() => setPanel(null), []);

  const openPanel = useCallback((next: Exclude<MobilePanel, null>) => {
    setPanel(next);
  }, []);

  const togglePanel = useCallback((next: Exclude<MobilePanel, null>) => {
    setPanel((current) => (current === next ? null : next));
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (media.matches) setPanel(null);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const value = useMemo(
    () => ({ panel, openPanel, closePanel, togglePanel }),
    [panel, openPanel, closePanel, togglePanel]
  );

  return <MobilePanelsContext.Provider value={value}>{children}</MobilePanelsContext.Provider>;
}
