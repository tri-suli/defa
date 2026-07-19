import { describe, it, expect } from 'vitest';
import { buildProgram } from '../src/cli';

describe('buildProgram', () => {
  it('registers all MVP commands', () => {
    const program = buildProgram();
    const names = program.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['deploy', 'diff', 'import', 'rollback', 'status']);
  });
});
