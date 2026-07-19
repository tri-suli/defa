import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import type { DefaConfig } from './types';

const DEFAULT_MANAGED = ['CLAUDE.md', 'skills', 'commands', 'agents'];

const DEFAULT_SECRET_PATTERNS = [
  'sk-[A-Za-z0-9]{16,}',
  'AKIA[0-9A-Z]{16}',
  'ghp_[A-Za-z0-9]{36}',
  'xox[baprs]-[A-Za-z0-9-]{10,}',
  '-----BEGIN [A-Z ]*PRIVATE KEY-----',
];

function expandHome(input: string): string {
  return input.startsWith('~') ? resolve(input.replace('~', homedir())) : resolve(input);
}

export function loadConfig(projectRoot: string, configPath?: string): DefaConfig {
  const path = configPath ?? join(projectRoot, 'defa.config.json');
  const raw = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
  return {
    targetRoot: raw.targetRoot ? expandHome(raw.targetRoot) : join(homedir(), '.claude'),
    payloadDir: join(projectRoot, 'payload', 'claude'),
    managed: raw.managed ?? DEFAULT_MANAGED,
    secretPatterns: raw.secretPatterns ?? DEFAULT_SECRET_PATTERNS,
  };
}
