import type { GenerationError } from '@/types/lwcExport';
import { isReservedJsWord } from './jsIdentifiers';

/**
 * Maps generator errors to short messages an LWC developer can act on.
 * Does not include stack traces.
 */
export function formatLwcExportError(error: GenerationError): string {
  const { message } = error;

  if (
    /canvas is empty/i.test(message) ||
    /Add at least one component before generating/i.test(message)
  ) {
    return 'Add at least one component to the canvas before exporting an LWC.';
  }

  if (/Invalid LWC component name/i.test(message)) {
    return 'Cannot export component: invalid component name.';
  }

  const unknownType = message.match(
    /No ComponentDefinition is registered for type "([^"]+)"/
  );
  if (unknownType?.[1]) {
    return `Cannot export component: unknown component type '${unknownType[1]}'.`;
  }

  const identifier =
    message.match(/Event handler "([^"]+)"/)?.[1] ??
    message.match(/Binding "([^"]+)"/)?.[1];
  if (identifier && isReservedJsWord(identifier)) {
    return `Cannot export component: JavaScript identifier '${identifier}' is reserved.`;
  }

  return `Cannot export component: ${message}`;
}
