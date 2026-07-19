import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
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
  it('classifies new, changed and same', () => {
    writeFileSync(join(payload, 'new.md'), 'brand new');
    writeFileSync(join(payload, 'changed.md'), 'v2');
    writeFileSync(join(target, 'changed.md'), 'v1');
    writeFileSync(join(payload, 'same.md'), 'identical');
    writeFileSync(join(target, 'same.md'), 'identical');

    const entries = diffFiles(payload, target, ['new.md', 'changed.md', 'same.md']);
    const byPath = Object.fromEntries(entries.map((e) => [e.relPath, e.change]));
    expect(byPath).toEqual({ 'new.md': 'new', 'changed.md': 'changed', 'same.md': 'same' });
    expect(entries.find((e) => e.relPath === 'new.md')!.targetContent).toBeNull();
  });
});
