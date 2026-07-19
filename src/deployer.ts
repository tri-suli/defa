import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { DiffEntry } from './types';

export function deploy(payloadDir: string, targetDir: string, entries: DiffEntry[]): string[] {
  const written: string[] = [];
  for (const entry of entries) {
    if (entry.change === 'same') continue;
    const dest = join(targetDir, entry.relPath);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(payloadDir, entry.relPath), dest);
    written.push(entry.relPath);
  }
  return written;
}
