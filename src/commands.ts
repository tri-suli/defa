import type { DefaConfig, DiffEntry, SecretFinding } from './types';
import { enumeratePayload } from './enumerator';
import { compilePatterns, scanFiles } from './scanner';
import { diffFiles } from './differ';

export interface DeployPlan {
  findings: SecretFinding[];
  entries: DiffEntry[];
  blocked: boolean;
}

export async function buildDeployPlan(config: DefaConfig, force: boolean): Promise<DeployPlan> {
  const relPaths = await enumeratePayload(config.payloadDir);
  const patterns = compilePatterns(config.secretPatterns);
  const findings = scanFiles(config.payloadDir, relPaths, patterns);
  const entries = diffFiles(config.payloadDir, config.targetRoot, relPaths);
  const blocked = findings.length > 0 && !force;
  return { findings, entries, blocked };
}
