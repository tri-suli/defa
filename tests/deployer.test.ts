import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, lstatSync, readlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deploy } from '../src/deployer';
import type { DiffEntry } from '../src/types';

const NOW = new Date('2026-09-26T07:30:00.000Z');
const SUFFIX = '.defa-backup-2026-09-26T07-30-00-000Z';

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
  it('symlinks a new entry to the payload file', () => {
    writeFileSync(join(payload, 'CLAUDE.md'), 'payload');
    const entries: DiffEntry[] = [
      { relPath: 'CLAUDE.md', change: 'new', payloadContent: 'payload', targetContent: null },
    ];

    const result = deploy(payload, target, entries, NOW);

    expect(result).toEqual({ written: ['CLAUDE.md'], backedUp: [] });
    expect(lstatSync(join(target, 'CLAUDE.md')).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(target, 'CLAUDE.md'))).toBe(join(payload, 'CLAUDE.md'));
  });

  it('backs up an existing target file before replacing it with a link', () => {
    writeFileSync(join(payload, 'CLAUDE.md'), 'payload');
    writeFileSync(join(target, 'CLAUDE.md'), 'old target');
    const entries: DiffEntry[] = [
      { relPath: 'CLAUDE.md', change: 'changed', payloadContent: 'payload', targetContent: 'old target' },
    ];

    const result = deploy(payload, target, entries, NOW);

    expect(result.backedUp).toEqual([`CLAUDE.md${SUFFIX}`]);
    expect(readFileSync(join(target, `CLAUDE.md${SUFFIX}`), 'utf8')).toBe('old target');
    expect(lstatSync(join(target, 'CLAUDE.md')).isSymbolicLink()).toBe(true);
    expect(readFileSync(join(target, 'CLAUDE.md'), 'utf8')).toBe('payload');
  });

  it('skips linked entries and never touches foreign files', () => {
    writeFileSync(join(target, 'foreign.md'), 'do not touch');
    const entries: DiffEntry[] = [
      { relPath: 'linked.md', change: 'linked', payloadContent: 'x', targetContent: 'x' },
    ];
    // 'linked.md' does not exist on disk; deployer must not touch it.

    const result = deploy(payload, target, entries, NOW);

    expect(result).toEqual({ written: [], backedUp: [] });
    expect(readFileSync(join(target, 'foreign.md'), 'utf8')).toBe('do not touch');
    expect(existsSync(join(target, 'linked.md'))).toBe(false);
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
