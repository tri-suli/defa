import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DiffEntry, ChangeType } from './types';

export function diffFiles(payloadDir: string, targetDir: string, relPaths: string[]): DiffEntry[] {
  return relPaths.map((rel) => {
    const payloadContent = readFileSync(join(payloadDir, rel), 'utf8');
    const targetPath = join(targetDir, rel);
    const exists = existsSync(targetPath);
    const targetContent = exists ? readFileSync(targetPath, 'utf8') : null;
    let change: ChangeType;
    if (!exists) change = 'new';
    else if (targetContent === payloadContent) change = 'same';
    else change = 'changed';
    return { relPath: rel, change, payloadContent, targetContent };
  });
}
