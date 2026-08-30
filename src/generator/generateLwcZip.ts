import JSZip from 'jszip';
import type { GenerationError, LwcBundleResult } from '@/types/lwcExport';

export interface LwcZipSuccess {
  ok: true;
  blob: Blob;
  zipFileName: string;
  paths: string[];
}

export interface LwcZipFailure {
  ok: false;
  errors: GenerationError[];
  warnings: GenerationError[];
}

export type LwcZipResult = LwcZipSuccess | LwcZipFailure;

/** Folder and file paths inside the downloaded LWC ZIP. */
export function lwcZipEntryPaths(componentName: string): {
  html: string;
  js: string;
  metaXml: string;
  zipFileName: string;
} {
  return {
    html: `${componentName}/${componentName}.html`,
    js: `${componentName}/${componentName}.js`,
    metaXml: `${componentName}/${componentName}.js-meta.xml`,
    zipFileName: `${componentName}.zip`,
  };
}

/**
 * Packages a successful `generateLwcBundle()` result as a browser ZIP.
 * Does not generate HTML/JS/XML itself. Refuses to zip when the bundle has errors.
 */
export async function generateLwcZip(
  result: LwcBundleResult,
  componentName: string
): Promise<LwcZipResult> {
  if (result.errors.length > 0) {
    return {
      ok: false,
      errors: result.errors,
      warnings: result.warnings,
    };
  }

  const paths = lwcZipEntryPaths(componentName);
  const zip = new JSZip();
  zip.file(paths.html, result.files.html);
  zip.file(paths.js, result.files.js);
  zip.file(paths.metaXml, result.files.metaXml);

  const bytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
  });
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: 'application/zip' });

  return {
    ok: true,
    blob,
    zipFileName: paths.zipFileName,
    paths: [paths.html, paths.js, paths.metaXml],
  };
}
