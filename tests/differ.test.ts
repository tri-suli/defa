import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diffFiles } from '../src/differ';

let payload: string, target: string;
beforeEach(() => {
  payload = mkdtempSync(join(tmpdir(), 'defa-diff-p-'));
  target = mkdtempSync(join(tmpdir(), 'defa-diff-t-'));
});
afterEach(() => {
  rmSync(payload, { recursive: true, force: true });
  rmSync(target, { recursive: true, force: true });
});

describe('diffFiles', () => {
  it('classifies new, changed, unlinked and linked', () => {
    writeFileSync(join(payload, 'new.md'), 'brand new');
    writeFileSync(join(payload, 'changed.md'), 'v2');
    writeFileSync(join(target, 'changed.md'), 'v1');
    writeFileSync(join(payload, 'copy.md'), 'identical');
    writeFileSync(join(target, 'copy.md'), 'identical');
    writeFileSync(join(payload, 'linked.md'), 'linked');
    symlinkSync(join(payload, 'linked.md'), join(target, 'linked.md'));

    const entries = diffFiles(payload, target, ['new.md', 'changed.md', 'copy.md', 'linked.md']);
    const byPath = Object.fromEntries(entries.map((e) => [e.relPath, e.change]));
    expect(byPath).toEqual({
      'new.md': 'new',
      'changed.md': 'changed',
      'copy.md': 'unlinked',
      'linked.md': 'linked',
    });
    expect(entries.find((e) => e.relPath === 'new.md')!.targetContent).toBeNull();
  });

  it('treats a dangling symlink in the target as changed, not new', () => {
    writeFileSync(join(payload, 'CLAUDE.md'), 'payload');
    symlinkSync(join(target, 'missing.md'), join(target, 'CLAUDE.md'));

    const [entry] = diffFiles(payload, target, ['CLAUDE.md']);

    expect(entry.change).toBe('changed');
    expect(entry.targetContent).toBeNull();
  });
});
