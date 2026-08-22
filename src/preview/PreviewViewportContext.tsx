'use client';

import { createContext, useContext } from 'react';
import type { LayoutViewport } from '@/types/style';

/** Preview breakpoint for lightning-layout-item size cascade. */
export const PreviewViewportContext = createContext<LayoutViewport>('large');

export function usePreviewViewport(): LayoutViewport {
  return useContext(PreviewViewportContext);
}
