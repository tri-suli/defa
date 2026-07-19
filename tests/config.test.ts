import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../src/config';

let root: string;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'defa-cfg-')); });
afterEach(() => { rmSync(root, { recursive: true, force: true }); });

describe('loadConfig', () => {
  it('applies defaults when no config file exists', () => {
    const cfg = loadConfig(root);
    expect(cfg.targetRoot).toBe(join(homedir(), '.claude'));
    expect(cfg.managed).toEqual(['CLAUDE.md', 'skills', 'commands', 'agents']);
    expect(cfg.payloadDir).toBe(join(root, 'payload', 'claude'));
    expect(cfg.secretPatterns.length).toBeGreaterThan(0);
  });

  it('overrides targetRoot from config file', () => {
    writeFileSync(join(root, 'defa.config.json'), JSON.stringify({ targetRoot: '/tmp/custom-claude' }));
    const cfg = loadConfig(root);
    expect(cfg.targetRoot).toBe('/tmp/custom-claude');
  });
});
