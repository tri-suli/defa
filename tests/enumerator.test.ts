import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { enumeratePayload } from '../src/enumerator';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'defa-enum-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('enumeratePayload', () => {
  it('lists relative file paths sorted, including nested', async () => {
    writeFileSync(join(dir, 'CLAUDE.md'), 'a');
    mkdirSync(join(dir, 'skills', 'foo'), { recursive: true });
    writeFileSync(join(dir, 'skills', 'foo', 'SKILL.md'), 'b');
    const files = await enumeratePayload(dir);
    expect(files).toEqual(['CLAUDE.md', 'skills/foo/SKILL.md']);
  });
});
