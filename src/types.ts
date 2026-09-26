export interface DefaConfig {
  /** Absolute path to the deploy target, defaults to ~/.claude */
  targetRoot: string;
  /** Absolute path to payload/claude inside the DEFA repo */
  payloadDir: string;
  /** Managed top-level artifacts */
  managed: string[];
  /** Regex source strings for the secret scanner */
  secretPatterns: string[];
}

/**
 * new: target missing; changed: target content differs; unlinked: same content
 * but not a link to the payload; linked: target is a symlink to the payload file.
 */
export type ChangeType = 'new' | 'changed' | 'unlinked' | 'linked';

export interface DiffEntry {
  relPath: string;
  change: ChangeType;
  payloadContent: string;
  targetContent: string | null;
}

export interface SecretFinding {
  relPath: string;
  line: number;
  pattern: string;
  snippet: string;
}

export interface DeployRecord {
  deployedAt: string;
  written: string[];
  backedUp: string[];
}
