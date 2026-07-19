import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildDeployPlan } from '../src/commands';
import type { DefaConfig } from '../src/types';

let root: string, payloadDir: string, target: string;
function makeConfig(): DefaConfig {
  return {
    targetRoot: target,
    payloadDir,
    managed: ['CLAUDE.md'],
    secretPatterns: ['sk-[A-Za-z0-9]{16,}'],
  };
}
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'defa-cmd-'));
  payloadDir = join(root, 'payload', 'claude');
  target = join(root, 'target');
  mkdirSync(payloadDir, { recursive: true });
  mkdirSync(target, { recursive: true });
});
afterEach(() => { rmSync(root, { recursive: true, force: true }); });

describe('buildDeployPlan', () => {
  it('blocks when a secret is found and force is false', async () => {
    writeFileSync(join(payloadDir, 'CLAUDE.md'), 'token = sk-ABCDEFGHIJKLMNOP123');
    const plan = await buildDeployPlan(makeConfig(), false);
    expect(plan.findings).toHaveLength(1);
    expect(plan.blocked).toBe(true);
    expect(plan.entries[0].change).toBe('new');
  });

  it('does not block a clean payload', async () => {
    writeFileSync(join(payloadDir, 'CLAUDE.md'), 'clean content');
    const plan = await buildDeployPlan(makeConfig(), false);
    expect(plan.findings).toHaveLength(0);
    expect(plan.blocked).toBe(false);
  });

  it('does not block when force is true even with a secret', async () => {
    writeFileSync(join(payloadDir, 'CLAUDE.md'), 'token = sk-ABCDEFGHIJKLMNOP123');
    const plan = await buildDeployPlan(makeConfig(), true);
    expect(plan.findings).toHaveLength(1);
    expect(plan.blocked).toBe(false);
  });
});
