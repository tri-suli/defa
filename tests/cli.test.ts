import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildProgram, isDirectExecution } from '../src/cli';
import { loadConfig } from '../src/config';
import type { DefaConfig } from '../src/types';

const questionMock = vi.fn<(query: string) => Promise<string>>();

vi.mock('node:readline/promises', () => ({
  createInterface: () => ({
    question: (query: string) => questionMock(query),
    close: () => {},
  }),
}));

vi.mock('../src/config', () => ({ loadConfig: vi.fn() }));

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

describe('import command', () => {
  let target: string, project: string, payload: string;

  beforeEach(() => {
    target = mkdtempSync(join(tmpdir(), 'defa-cli-t-'));
    project = mkdtempSync(join(tmpdir(), 'defa-cli-p-'));
    payload = join(project, 'payload', 'claude');
    const config: DefaConfig = {
      targetRoot: target,
      payloadDir: payload,
      managed: ['CLAUDE.md'],
      secretPatterns: [],
    };
    vi.mocked(loadConfig).mockReturnValue(config);
    questionMock.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    rmSync(target, { recursive: true, force: true });
    rmSync(project, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  async function runImport(...extraArgs: string[]): Promise<void> {
    await buildProgram().parseAsync(['import', ...extraArgs], { from: 'user' });
  }

  it('imports without prompting when no payload entries would be overwritten', async () => {
    writeFileSync(join(target, 'CLAUDE.md'), 'target copy');

    await runImport();

    expect(questionMock).not.toHaveBeenCalled();
    expect(readFileSync(join(payload, 'CLAUDE.md'), 'utf8')).toBe('target copy');
  });

  it('prompts and overwrites when confirmed', async () => {
    writeFileSync(join(target, 'CLAUDE.md'), 'target copy');
    await runImport();
    writeFileSync(join(payload, 'CLAUDE.md'), 'curated copy');
    questionMock.mockResolvedValue('y');

    await runImport();

    expect(questionMock).toHaveBeenCalledOnce();
    expect(readFileSync(join(payload, 'CLAUDE.md'), 'utf8')).toBe('target copy');
  });

  it('aborts and leaves the payload untouched when declined', async () => {
    writeFileSync(join(target, 'CLAUDE.md'), 'target copy');
    await runImport();
    writeFileSync(join(payload, 'CLAUDE.md'), 'curated copy');
    questionMock.mockResolvedValue('n');

    await runImport();

    expect(questionMock).toHaveBeenCalledOnce();
    expect(readFileSync(join(payload, 'CLAUDE.md'), 'utf8')).toBe('curated copy');
    expect(console.log).toHaveBeenCalledWith('Aborted.');
  });

  it('overwrites without prompting when --force is given', async () => {
    writeFileSync(join(target, 'CLAUDE.md'), 'target copy');
    await runImport();
    writeFileSync(join(payload, 'CLAUDE.md'), 'curated copy');

    await runImport('--force');

    expect(questionMock).not.toHaveBeenCalled();
    expect(readFileSync(join(payload, 'CLAUDE.md'), 'utf8')).toBe('target copy');
  });
});
