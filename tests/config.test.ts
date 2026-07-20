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

  it('throws a descriptive error on malformed JSON', () => {
    writeFileSync(join(root, 'defa.config.json'), '{ targetRoot: oops');
    expect(() => loadConfig(root)).toThrow(/Invalid JSON in .*defa\.config\.json/);
  });

  it('throws when the config root is not an object', () => {
    writeFileSync(join(root, 'defa.config.json'), '"just a string"');
    expect(() => loadConfig(root)).toThrow(/must be a JSON object/);
  });

  it('throws when targetRoot is not a string', () => {
    writeFileSync(join(root, 'defa.config.json'), JSON.stringify({ targetRoot: 42 }));
    expect(() => loadConfig(root)).toThrow(/targetRoot must be a string/);
  });

  it('throws when managed is not an array of strings', () => {
    writeFileSync(join(root, 'defa.config.json'), JSON.stringify({ managed: ['ok', 7] }));
    expect(() => loadConfig(root)).toThrow(/managed must be an array of strings/);
  });

  it('throws when secretPatterns is not an array of strings', () => {
    writeFileSync(join(root, 'defa.config.json'), JSON.stringify({ secretPatterns: 'sk-.*' }));
    expect(() => loadConfig(root)).toThrow(/secretPatterns must be an array of strings/);
  });
});
