import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SecretFinding } from './types';

export function compilePatterns(sources: string[]): RegExp[] {
  // No global flag: keep each RegExp stateless across lines.
  return sources.map((source) => new RegExp(source));
}

export function scanContent(relPath: string, content: string, patterns: RegExp[]): SecretFinding[] {
  const findings: SecretFinding[] = [];
  content.split('\n').forEach((rawLine, index) => {
    // Strip the trailing \r of CRLF files so end-anchored patterns still match.
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (match) {
        findings.push({ relPath, line: index + 1, pattern: pattern.source, snippet: match[0] });
      }
    }
  });
  return findings;
}

export function scanFiles(baseDir: string, relPaths: string[], patterns: RegExp[]): SecretFinding[] {
  return relPaths.flatMap((rel) =>
    scanContent(rel, readFileSync(join(baseDir, rel), 'utf8'), patterns),
  );
}
