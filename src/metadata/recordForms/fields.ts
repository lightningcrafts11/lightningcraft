import type { ComponentPropertyDefinition } from '@/types/component';
import { asObjectList } from '@/utils/objectList';

/**
 * Converts the builder object-list into the Salesforce `fields` string[].
 * Strips LightningCraft keys. Never includes sample values.
 */
export function toSalesforceFieldApiNames(value: unknown): string[] {
  return asObjectList(value)
    .map((item) => {
      const name = item.fieldApiName;
      return typeof name === 'string' ? name.trim() : '';
    })
    .filter((name) => name !== '');
}

export const RECORD_FORM_FIELD_ITEM_PROPERTIES: ComponentPropertyDefinition[] = [
  {
    name: 'fieldApiName',
    label: 'Field API Name',
    type: 'text',
    required: true,
    description: 'API name of a field on the same object, for example Name or Phone.',
    placeholder: 'Name',
  },
];
