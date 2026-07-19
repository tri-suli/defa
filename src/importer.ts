import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
