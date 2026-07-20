import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Managed items present in both the target root and the payload, i.e. entries an import would overwrite. */
export function findOverwriteConflicts(targetRoot: string, payloadDir: string, managed: string[]): string[] {
  return managed.filter((item) => existsSync(join(targetRoot, item)) && existsSync(join(payloadDir, item)));
}

export function importFromTarget(targetRoot: string, payloadDir: string, managed: string[]): string[] {
  const imported: string[] = [];
  for (const item of managed) {
    const source = join(targetRoot, item);
    if (!existsSync(source)) continue;
    cpSync(source, join(payloadDir, item), { recursive: true });
    imported.push(item);
  }
  return imported;
}
