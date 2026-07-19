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

export type ChangeType = 'new' | 'changed' | 'same';

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
}
