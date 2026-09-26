import { mkdirSync, renameSync, symlinkSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import type { DiffEntry } from './types';

export interface DeployResult {
  written: string[];
  backedUp: string[];
}

function resolveWithinTarget(targetDir: string, relPath: string): string {
  const dest = resolve(targetDir, relPath);
  const escape = relative(resolve(targetDir), dest);
  if (isAbsolute(relPath) || escape.startsWith('..') || isAbsolute(escape)) {
    throw new Error(`Refusing to deploy outside target root: ${relPath}`);
  }
  return dest;
}

/** Symlinks each payload file into the target; an existing target file is moved aside first. */
export function deploy(
  payloadDir: string,
  targetDir: string,
  entries: DiffEntry[],
  now: Date = new Date(),
): DeployResult {
  const suffix = `.defa-backup-${now.toISOString().replace(/[:.]/g, '-')}`;
  const result: DeployResult = { written: [], backedUp: [] };
  for (const entry of entries) {
    if (entry.change === 'linked') continue;
    const dest = resolveWithinTarget(targetDir, entry.relPath);
    mkdirSync(dirname(dest), { recursive: true });
    if (entry.change !== 'new') {
      renameSync(dest, dest + suffix);
      result.backedUp.push(entry.relPath + suffix);
    }
    symlinkSync(resolve(payloadDir, entry.relPath), dest);
    result.written.push(entry.relPath);
  }
  return result;
}
