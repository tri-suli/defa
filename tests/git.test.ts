import { describe, it, expect, vi } from 'vitest';
import { checkoutPreviousPayload } from '../src/git';

describe('checkoutPreviousPayload', () => {
  it('checks out payload/claude from the previous commit', () => {
    const exec = vi.fn().mockReturnValue('');
    checkoutPreviousPayload('/repo', exec);
    expect(exec).toHaveBeenCalledWith('git', ['checkout', 'HEAD~1', '--', 'payload/claude'], '/repo');
  });
});
