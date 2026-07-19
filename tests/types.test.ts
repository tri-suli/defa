import { describe, it, expect } from 'vitest';
import type { DiffEntry } from '../src/types';

describe('types', () => {
  it('DiffEntry shape is usable', () => {
    const entry: DiffEntry = {
      relPath: 'CLAUDE.md',
      change: 'new',
      payloadContent: 'hello',
      targetContent: null,
    };
    expect(entry.change).toBe('new');
  });
});
