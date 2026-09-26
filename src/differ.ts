import { readFileSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { isLinkedTo } from './links';
import type { DiffEntry, ChangeType } from './types';

function pathExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function readIfReadable(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

export function diffFiles(payloadDir: string, targetDir: string, relPaths: string[]): DiffEntry[] {
  return relPaths.map((rel) => {
    const payloadPath = join(payloadDir, rel);
    const payloadContent = readFileSync(payloadPath, 'utf8');
    const targetPath = join(targetDir, rel);
    // lstat-based so a dangling symlink counts as present (it must be replaced, not skipped).
    const exists = pathExists(targetPath);
    const targetContent = exists ? readIfReadable(targetPath) : null;
    let change: ChangeType;
    if (!exists) change = 'new';
    else if (isLinkedTo(targetPath, payloadPath)) change = 'linked';
    else if (targetContent === payloadContent) change = 'unlinked';
    else change = 'changed';
    return { relPath: rel, change, payloadContent, targetContent };
  });
}
