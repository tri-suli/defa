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
      { relPath: 'c', change: 'same', payloadContent: '', targetContent: '' },
    ];
    expect(renderStatus(entries)).toBe('new: 1  changed: 1  same: 1');
  });

  it('renderDiff includes added content lines and skips same', () => {
    const entries: DiffEntry[] = [
      { relPath: 'a.md', change: 'new', payloadContent: 'hello world', targetContent: null },
      { relPath: 'b.md', change: 'same', payloadContent: 'x', targetContent: 'x' },
    ];
    const out = renderDiff(entries);
    expect(out).toContain('hello world');
    expect(out).not.toContain('b.md');
  });

  it('renderPlan combines status summary and diff output', () => {
    const entries: DiffEntry[] = [
      { relPath: 'a.md', change: 'new', payloadContent: 'hello world', targetContent: null },
      { relPath: 'b.md', change: 'same', payloadContent: 'x', targetContent: 'x' },
    ];
    const out = renderPlan(entries);
    expect(out).toContain('new: 1  changed: 0  same: 1');
    expect(out).toContain('hello world');
  });

  it('renderFindings lists path and line', () => {
    const findings: SecretFinding[] = [
      { relPath: 'CLAUDE.md', line: 3, pattern: 'sk-x', snippet: 'sk-x' },
    ];
    expect(renderFindings(findings)).toContain('CLAUDE.md:3');
  });
});
