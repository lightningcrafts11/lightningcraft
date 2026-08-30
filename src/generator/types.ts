export type { GenerationError } from '@/types/lwcExport';
import type { GenerationError } from '@/types/lwcExport';

export interface GenerateLwcHtmlResult {
  html: string;
  errors: GenerationError[];
}
