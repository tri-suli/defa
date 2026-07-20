import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DeployRecord } from '../src/types';

// Stub the confirm prompt: cli.ts builds its readline interface from
// node:readline/promises, so mocking the module intercepts `confirm`.
const { questionMock } = vi.hoisted(() => ({ questionMock: vi.fn<() => Promise<string>>() }));

vi.mock('node:readline/promises', () => ({
  createInterface: () => ({
    question: questionMock,
    close: () => {},
  }),
}));

import { buildProgram } from '../src/cli';

let projectRoot: string;
let payloadDir: string;
let targetRoot: string;
let originalCwd: string;

function writeConfig(): void {
  writeFileSync(join(projectRoot, 'defa.config.json'), JSON.stringify({ targetRoot }));
}

function writePayloadFile(relPath: string, content: string): void {
  writeFileSync(join(payloadDir, relPath), content);
}

async function runCli(...args: string[]): Promise<void> {
  await buildProgram().parseAsync(args, { from: 'user' });
}

function readDeployRecord(): DeployRecord {
  return JSON.parse(readFileSync(join(projectRoot, '.defa', 'last-deploy.json'), 'utf8'));
}

beforeEach(() => {
  originalCwd = process.cwd();
  projectRoot = mkdtempSync(join(tmpdir(), 'defa-cli-'));
  payloadDir = join(projectRoot, 'payload', 'claude');
  targetRoot = join(projectRoot, 'target-claude');
  mkdirSync(payloadDir, { recursive: true });
  mkdirSync(targetRoot, { recursive: true });
  writeConfig();
  // The command actions resolve config and the deploy record from cwd().
  process.chdir(projectRoot);
  questionMock.mockReset();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
  rmSync(projectRoot, { recursive: true, force: true });
});

describe('deploy command (integration)', () => {
  it('blocks on secret findings without --force and writes nothing', async () => {
    writePayloadFile('CLAUDE.md', 'token = sk-ABCDEFGHIJKLMNOP123');

    await runCli('deploy');

    expect(questionMock).not.toHaveBeenCalled();
    expect(existsSync(join(targetRoot, 'CLAUDE.md'))).toBe(false);
    expect(existsSync(join(projectRoot, '.defa', 'last-deploy.json'))).toBe(false);
  });

  it('deploys a payload containing a secret when --force is given and confirmed', async () => {
    writePayloadFile('CLAUDE.md', 'token = sk-ABCDEFGHIJKLMNOP123');
    questionMock.mockResolvedValue('y');

    await runCli('deploy', '--force');

    expect(readFileSync(join(targetRoot, 'CLAUDE.md'), 'utf8')).toBe(
      'token = sk-ABCDEFGHIJKLMNOP123',
    );
    expect(readDeployRecord().written).toEqual(['CLAUDE.md']);
  });

  it('writes changed files and records the deploy when confirmed', async () => {
    writePayloadFile('CLAUDE.md', 'payload content');
    writePayloadFile('unchanged.md', 'already deployed');
    writeFileSync(join(targetRoot, 'unchanged.md'), 'already deployed');
    questionMock.mockResolvedValue('y');

    await runCli('deploy');

    expect(questionMock).toHaveBeenCalledOnce();
    expect(readFileSync(join(targetRoot, 'CLAUDE.md'), 'utf8')).toBe('payload content');
    const record = readDeployRecord();
    expect(record.written).toEqual(['CLAUDE.md']);
    expect(new Date(record.deployedAt).getTime()).not.toBeNaN();
  });

  it('overwrites a stale target file when confirmed', async () => {
    writePayloadFile('CLAUDE.md', 'new version');
    writeFileSync(join(targetRoot, 'CLAUDE.md'), 'old version');
    questionMock.mockResolvedValue('yes');

    await runCli('deploy');

    expect(readFileSync(join(targetRoot, 'CLAUDE.md'), 'utf8')).toBe('new version');
    expect(readDeployRecord().written).toEqual(['CLAUDE.md']);
  });

  it('aborts without writing when the confirmation is declined', async () => {
    writePayloadFile('CLAUDE.md', 'payload content');
    questionMock.mockResolvedValue('n');

    await runCli('deploy');

    expect(questionMock).toHaveBeenCalledOnce();
    expect(existsSync(join(targetRoot, 'CLAUDE.md'))).toBe(false);
    expect(existsSync(join(projectRoot, '.defa', 'last-deploy.json'))).toBe(false);
  });
});

describe('rollback command (integration)', () => {
  function git(...args: string[]): void {
    execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8' });
  }

  it('restores the payload from the previous commit via a real git repo', async () => {
    git('-c', 'init.defaultBranch=main', 'init', '--quiet');
    git('config', 'user.email', 'defa-test@example.com');
    git('config', 'user.name', 'DEFA Test');
    writePayloadFile('CLAUDE.md', 'version one');
    git('add', '.');
    git('commit', '-m', 'first payload');
    writePayloadFile('CLAUDE.md', 'version two');
    git('add', '.');
    git('commit', '-m', 'second payload');

    await runCli('rollback');

    expect(readFileSync(join(payloadDir, 'CLAUDE.md'), 'utf8')).toBe('version one');
    // Rollback only restores the payload; the target is untouched until deploy.
    expect(existsSync(join(targetRoot, 'CLAUDE.md'))).toBe(false);
  });
});