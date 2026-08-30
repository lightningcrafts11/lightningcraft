/**
 * Official Salesforce LWC folder/file naming rules.
 * @see https://developer.salesforce.com/docs/platform/lwc/guide/create-components-folder.html
 */
export function isValidLwcComponentName(name: string): boolean {
  if (!name) return false;
  if (!/^[a-z][a-zA-Z0-9_]*$/.test(name)) return false;
  if (name.endsWith('_')) return false;
  if (name.includes('__')) return false;
  if (name.includes('-')) return false;
  return true;
}

export function lwcComponentNameError(name: string): string {
  return (
    `Invalid LWC component name "${name}". Names must start with a lowercase letter, ` +
    'contain only letters, digits, or underscores, and cannot include hyphens, spaces, ' +
    'consecutive underscores, or a trailing underscore.'
  );
}

/**
 * Folder `myComponent` → class `MyComponent`.
 * Folder `another_component` → class `AnotherComponent`.
 */
export function toLwcClassName(componentName: string): string {
  return componentName
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
