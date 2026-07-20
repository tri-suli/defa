import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildProgram, isDirectExecution } from '../src/cli';

describe('buildProgram', () => {
  it('registers all MVP commands', () => {
    const program = buildProgram();
    const names = program.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['deploy', 'diff', 'import', 'rollback', 'status']);
  });
});

describe('isDirectExecution', () => {
  let dir: string;
  let entryFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'defa-cli-'));
    entryFile = join(dir, 'cli.js');
    writeFileSync(entryFile, '');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns true when argv[1] is the module file itself', () => {
    expect(isDirectExecution(pathToFileURL(entryFile).href, entryFile)).toBe(true);
  });

  it('returns true when argv[1] is a symlink to the module file', () => {
    const link = join(dir, 'defa');
    symlinkSync(entryFile, link);
    expect(isDirectExecution(pathToFileURL(entryFile).href, link)).toBe(true);
  });

  it('returns false when argv[1] is a different file', () => {
    const other = join(dir, 'other.js');
    writeFileSync(other, '');
    expect(isDirectExecution(pathToFileURL(entryFile).href, other)).toBe(false);
  });

  it('returns false when argv[1] is undefined', () => {
    expect(isDirectExecution(pathToFileURL(entryFile).href, undefined)).toBe(false);
  });

  it('returns false when argv[1] does not exist instead of throwing', () => {
    expect(isDirectExecution(pathToFileURL(entryFile).href, join(dir, 'missing'))).toBe(false);
  });
});
