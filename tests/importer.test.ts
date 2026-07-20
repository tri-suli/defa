import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importFromTarget, findOverwriteConflicts } from '../src/importer';

let target: string, payload: string;
beforeEach(() => {
  target = mkdtempSync(join(tmpdir(), 'defa-imp-t-'));
  payload = mkdtempSync(join(tmpdir(), 'defa-imp-p-'));
});
afterEach(() => {
  rmSync(target, { recursive: true, force: true });
  rmSync(payload, { recursive: true, force: true });
});

describe('importFromTarget', () => {
  it('copies existing managed artifacts and skips missing ones', () => {
    writeFileSync(join(target, 'CLAUDE.md'), 'global instructions');
    mkdirSync(join(target, 'skills'), { recursive: true });
    writeFileSync(join(target, 'skills', 'a.md'), 'skill a');
    // no commands/, no agents/

    const imported = importFromTarget(target, payload, ['CLAUDE.md', 'skills', 'commands', 'agents']);

    expect(imported.sort()).toEqual(['CLAUDE.md', 'skills']);
    expect(readFileSync(join(payload, 'CLAUDE.md'), 'utf8')).toBe('global instructions');
    expect(readFileSync(join(payload, 'skills', 'a.md'), 'utf8')).toBe('skill a');
    expect(existsSync(join(payload, 'commands'))).toBe(false);
  });

  it('overwrites payload entries that already exist', () => {
    writeFileSync(join(target, 'CLAUDE.md'), 'fresh instructions');
    writeFileSync(join(payload, 'CLAUDE.md'), 'stale instructions');

    const imported = importFromTarget(target, payload, ['CLAUDE.md']);

    expect(imported).toEqual(['CLAUDE.md']);
    expect(readFileSync(join(payload, 'CLAUDE.md'), 'utf8')).toBe('fresh instructions');
  });
});

describe('findOverwriteConflicts', () => {
  it('returns only managed items present in both target and payload', () => {
    writeFileSync(join(target, 'CLAUDE.md'), 'target copy');
    writeFileSync(join(payload, 'CLAUDE.md'), 'payload copy');
    mkdirSync(join(target, 'skills'), { recursive: true }); // target only
    mkdirSync(join(payload, 'commands'), { recursive: true }); // payload only

    const conflicts = findOverwriteConflicts(target, payload, ['CLAUDE.md', 'skills', 'commands', 'agents']);

    expect(conflicts).toEqual(['CLAUDE.md']);
  });

  it('returns an empty list on first-time bootstrap', () => {
    writeFileSync(join(target, 'CLAUDE.md'), 'target copy');

    expect(findOverwriteConflicts(target, payload, ['CLAUDE.md', 'skills'])).toEqual([]);
  });
});
