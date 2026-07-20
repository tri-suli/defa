import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deploy } from '../src/deployer';
import type { DiffEntry } from '../src/types';

let payload: string, target: string;
beforeEach(() => {
  payload = mkdtempSync(join(tmpdir(), 'defa-dep-p-'));
  target = mkdtempSync(join(tmpdir(), 'defa-dep-t-'));
});
afterEach(() => {
  rmSync(payload, { recursive: true, force: true });
  rmSync(target, { recursive: true, force: true });
});

describe('deploy', () => {
  it('writes new/changed, skips same, and never touches foreign files', () => {
    writeFileSync(join(payload, 'skills.md'), 'payload-v2');
    writeFileSync(join(target, 'foreign.md'), 'do not touch');

    const entries: DiffEntry[] = [
      { relPath: 'skills.md', change: 'changed', payloadContent: 'payload-v2', targetContent: 'v1' },
      { relPath: 'same.md', change: 'same', payloadContent: 'x', targetContent: 'x' },
    ];
    // 'same.md' does not exist in payload on disk; deployer must not read it (skip 'same').

    const written = deploy(payload, target, entries);

    expect(written).toEqual(['skills.md']);
    expect(readFileSync(join(target, 'skills.md'), 'utf8')).toBe('payload-v2');
    expect(existsSync(join(target, 'foreign.md'))).toBe(true);
    expect(existsSync(join(target, 'same.md'))).toBe(false);
  });

  it('rejects relPath escaping the target root via ..', () => {
    const entries: DiffEntry[] = [
      { relPath: '../escape.md', change: 'new', payloadContent: 'x', targetContent: null },
    ];
    expect(() => deploy(payload, target, entries)).toThrow(/outside target root/);
    expect(existsSync(join(target, '..', 'escape.md'))).toBe(false);
  });

  it('rejects absolute relPath', () => {
    const entries: DiffEntry[] = [
      { relPath: '/etc/evil.md', change: 'new', payloadContent: 'x', targetContent: null },
    ];
    expect(() => deploy(payload, target, entries)).toThrow(/outside target root/);
  });
});
