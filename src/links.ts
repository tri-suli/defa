import { lstatSync, realpathSync } from 'node:fs';

/** True when linkPath is a symlink that resolves to the same file as payloadPath. */
export function isLinkedTo(linkPath: string, payloadPath: string): boolean {
  try {
    return lstatSync(linkPath).isSymbolicLink() && realpathSync(linkPath) === realpathSync(payloadPath);
  } catch {
    return false;
  }
}
