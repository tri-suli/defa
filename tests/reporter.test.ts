import { describe, it, expect, beforeAll } from 'vitest';
import chalk from 'chalk';
import { renderStatus, renderDiff, renderFindings, renderPlan } from '../src/reporter';
import type { DiffEntry, SecretFinding } from '../src/types';

beforeAll(() => { chalk.level = 0; }); // deterministic, no ANSI codes

describe('reporter', () => {
  it('renderStatus counts each change type', () => {
    const entries: DiffEntry[] = [
      { relPath: 'a', change: 'new', payloadContent: '', targetContent: null },
      { relPath: 'b', change: 'changed', payloadContent: '', targetContent: '' },
      { relPath: 'c', change: 'unlinked', payloadContent: '', targetContent: '' },
      { relPath: 'd', change: 'linked', payloadContent: '', targetContent: '' },
    ];
    expect(renderStatus(entries)).toBe('new: 1  changed: 1  unlinked: 1  linked: 1');
  });

  it('renderDiff includes added content lines and skips unlinked and linked', () => {
    const entries: DiffEntry[] = [
      { relPath: 'a.md', change: 'new', payloadContent: 'hello world', targetContent: null },
      { relPath: 'b.md', change: 'unlinked', payloadContent: 'x', targetContent: 'x' },
      { relPath: 'c.md', change: 'linked', payloadContent: 'y', targetContent: 'y' },
    ];
    const out = renderDiff(entries);
    expect(out).toContain('hello world');
    expect(out).not.toContain('b.md');
    expect(out).not.toContain('c.md');
  });

  it('renderPlan combines status summary and diff output', () => {
    const entries: DiffEntry[] = [
      { relPath: 'a.md', change: 'new', payloadContent: 'hello world', targetContent: null },
      { relPath: 'b.md', change: 'linked', payloadContent: 'x', targetContent: 'x' },
    ];
    const out = renderPlan(entries);
    expect(out).toContain('new: 1  changed: 0  unlinked: 0  linked: 1');
    expect(out).toContain('hello world');
  });

  it('renderFindings lists path and line', () => {
    const findings: SecretFinding[] = [
      { relPath: 'CLAUDE.md', line: 3, pattern: 'sk-x', snippet: 'sk-x' },
    ];
    expect(renderFindings(findings)).toContain('CLAUDE.md:3');
  });
});
