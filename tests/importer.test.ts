import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importFromTarget } from '../src/importer';

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
});
