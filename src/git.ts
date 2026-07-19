import { execFileSync } from 'node:child_process';

export type Exec = (cmd: string, args: string[], cwd: string) => string;

export const defaultExec: Exec = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8' });

export function checkoutPreviousPayload(repoRoot: string, exec: Exec = defaultExec): void {
  exec('git', ['checkout', 'HEAD~1', '--', 'payload/claude'], repoRoot);
}
