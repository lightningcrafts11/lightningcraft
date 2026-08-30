import type { LwcExportSettings } from '@/types/lwcExport';

export function generateLwcMetaXml(settings: LwcExportSettings): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">',
    `    <apiVersion>${escapeXml(settings.apiVersion)}</apiVersion>`,
    `    <isExposed>${settings.isExposed ? 'true' : 'false'}</isExposed>`,
  ];

  if (settings.masterLabel && settings.masterLabel.trim() !== '') {
    lines.push(`    <masterLabel>${escapeXml(settings.masterLabel.trim())}</masterLabel>`);
  }
  if (settings.description && settings.description.trim() !== '') {
    lines.push(`    <description>${escapeXml(settings.description.trim())}</description>`);
  }
  if (settings.isExposed && settings.targets.length > 0) {
    lines.push('    <targets>');
    for (const target of settings.targets) {
      lines.push(`        <target>${escapeXml(target)}</target>`);
    }
    lines.push('    </targets>');
  }

  lines.push('</LightningComponentBundle>');
  return `${lines.join('\n')}\n`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
