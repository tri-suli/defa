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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function readRawConfig(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${path}: ${reason}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Invalid config in ${path}: must be a JSON object`);
  }
  const raw = parsed as Record<string, unknown>;
  if (raw.targetRoot !== undefined && typeof raw.targetRoot !== 'string') {
    throw new Error(`Invalid config in ${path}: targetRoot must be a string`);
  }
  if (raw.managed !== undefined && !isStringArray(raw.managed)) {
    throw new Error(`Invalid config in ${path}: managed must be an array of strings`);
  }
  if (raw.secretPatterns !== undefined && !isStringArray(raw.secretPatterns)) {
    throw new Error(`Invalid config in ${path}: secretPatterns must be an array of strings`);
  }
  return raw;
}

export function loadConfig(projectRoot: string, configPath?: string): DefaConfig {
  const path = configPath ?? join(projectRoot, 'defa.config.json');
  const raw = readRawConfig(path);
  return {
    targetRoot: raw.targetRoot ? expandHome(raw.targetRoot as string) : join(homedir(), '.claude'),
    payloadDir: join(projectRoot, 'payload', 'claude'),
    managed: (raw.managed as string[] | undefined) ?? DEFAULT_MANAGED,
    secretPatterns: (raw.secretPatterns as string[] | undefined) ?? DEFAULT_SECRET_PATTERNS,
  };
}