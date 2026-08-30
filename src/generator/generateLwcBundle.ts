import type { BuilderNode } from '@/types/builder';
import type { GenerationError, LwcBundleResult, LwcExportSettings } from '@/types/lwcExport';
import { DEFAULT_LWC_EXPORT_SETTINGS } from '@/types/lwcExport';
import { collectJsPlan } from './collectJsPlan';
import { generateLwcHtml } from './generateLwcHtml';
import { generateLwcJs } from './generateLwcJs';
import { generateLwcMetaXml } from './generateLwcMetaXml';
import { findInternalLeaks } from './stripInternalFields';
import { isValidLwcComponentName, lwcComponentNameError } from './validateLwcName';
import { walkBuilderTree } from './walkBuilderTree';

export function generateLwcBundle(
  tree: BuilderNode[],
  settings: LwcExportSettings = DEFAULT_LWC_EXPORT_SETTINGS
): LwcBundleResult {
  const emptyFiles = { html: '', js: '', metaXml: '' };
  const settingErrors = validateSettings(settings);
  if (tree.length === 0) {
    return {
      files: emptyFiles,
      errors: [
        {
          nodeId: '',
          componentType: '',
          message: 'The canvas is empty. Add at least one component before generating an LWC bundle.',
        },
        ...settingErrors,
      ],
      warnings: [],
    };
  }

  if (settingErrors.length > 0) {
    return { files: emptyFiles, errors: settingErrors, warnings: [] };
  }

  const plan = collectJsPlan(tree);
  const htmlResult = generateLwcHtml(tree, plan);
  const js = generateLwcJs(plan, settings.componentName);
  const metaXml = generateLwcMetaXml(settings);
  const html = wrapTemplate(htmlResult.html);

  const files = { html, js, metaXml };
  const errors = mergeErrors(plan.errors, htmlResult.errors, settingErrors);
  errors.push(...leakErrors(tree, files));

  return {
    files,
    errors,
    warnings: plan.warnings,
  };
}

function wrapTemplate(inner: string): string {
  const trimmed = inner.trim();
  if (trimmed === '') {
    return '<template>\n</template>\n';
  }
  const indented = trimmed
    .split('\n')
    .map((line) => (line === '' ? '' : `    ${line}`))
    .join('\n');
  return `<template>\n${indented}\n</template>\n`;
}

function validateSettings(settings: LwcExportSettings): GenerationError[] {
  const errors: GenerationError[] = [];
  if (!isValidLwcComponentName(settings.componentName)) {
    errors.push({
      nodeId: '',
      componentType: '',
      message: lwcComponentNameError(settings.componentName),
    });
  }
  if (!settings.apiVersion || settings.apiVersion.trim() === '') {
    errors.push({
      nodeId: '',
      componentType: '',
      message: 'LWC export settings require an apiVersion.',
    });
  }
  if (settings.isExposed && settings.targets.length === 0) {
    errors.push({
      nodeId: '',
      componentType: '',
      message: 'isExposed is true, so at least one target is required in js-meta.xml.',
    });
  }
  return errors;
}

function leakErrors(
  tree: BuilderNode[],
  files: { html: string; js: string; metaXml: string }
): GenerationError[] {
  const errors: GenerationError[] = [];
  const combined = `${files.html}\n${files.js}\n${files.metaXml}`;

  for (const leak of findInternalLeaks(files)) {
    errors.push({
      nodeId: '',
      componentType: '',
      message: `Generated ${leak.file} contains internal LightningCraft data (${leak.id}).`,
    });
  }

  for (const { node } of walkBuilderTree(tree)) {
    if (node.id && combined.includes(node.id)) {
      errors.push({
        nodeId: node.id,
        componentType: node.type,
        message: 'Generated LWC files contain a BuilderNode id, which must not be exported.',
      });
    }
  }

  return errors;
}

function mergeErrors(...lists: GenerationError[][]): GenerationError[] {
  const seen = new Set<string>();
  const merged: GenerationError[] = [];
  for (const list of lists) {
    for (const error of list) {
      const key = `${error.nodeId}|${error.componentType}|${error.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(error);
    }
  }
  return merged;
}
