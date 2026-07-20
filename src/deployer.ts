import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import type { DiffEntry } from './types';

function resolveWithinTarget(targetDir: string, relPath: string): string {
  const dest = resolve(targetDir, relPath);
  const escape = relative(resolve(targetDir), dest);
  if (isAbsolute(relPath) || escape.startsWith('..') || isAbsolute(escape)) {
    throw new Error(`Refusing to deploy outside target root: ${relPath}`);
  }
  return dest;
}

export function deploy(payloadDir: string, targetDir: string, entries: DiffEntry[]): string[] {
  const written: string[] = [];
  for (const entry of entries) {
    if (entry.change === 'same') continue;
    const dest = resolveWithinTarget(targetDir, entry.relPath);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(payloadDir, entry.relPath), dest);
    written.push(entry.relPath);
  }
  return written;
}