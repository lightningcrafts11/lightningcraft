/**
 * Central component registry.
 *
 * To add a Salesforce LWC component:
 *   1. Create a ComponentDefinition in the matching category file
 *      (or a new category file if one is needed).
 *   2. Export it from that file's array.
 *   3. Import and spread the array here if it is a new file.
 *
 * Core builder systems (library, drag/drop, canvas, future inspector and
 * HTML generator) read definitions generically. Do not add component-type
 * branches to those systems.
 */
import type { ComponentDefinition } from '@/types/component';
import { BASIC_COMPONENTS } from './components/basic';
import { FORM_COMPONENTS } from './components/forms';
import { RECORD_FORM_COMPONENTS } from './components/recordForms';
import { LAYOUT_COMPONENTS } from './components/layout';
import { DISPLAY_COMPONENTS } from './components/display';
import { DATATABLE_COMPONENTS } from './components/datatable';
import { MODAL_COMPONENTS } from './components/modal';

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  ...BASIC_COMPONENTS,
  ...FORM_COMPONENTS,
  ...RECORD_FORM_COMPONENTS,
  ...LAYOUT_COMPONENTS,
  ...DISPLAY_COMPONENTS,
  ...DATATABLE_COMPONENTS,
  ...MODAL_COMPONENTS,
];

export const COMPONENT_DEFINITION_MAP: ReadonlyMap<string, ComponentDefinition> = new Map(
  COMPONENT_DEFINITIONS.map((def) => [def.type, def])
);
