import chalk from 'chalk';
import { createTwoFilesPatch } from 'diff';
import type { DiffEntry, SecretFinding } from './types';

export function renderStatus(entries: DiffEntry[]): string {
  const counts = { new: 0, changed: 0, same: 0 };
  for (const entry of entries) counts[entry.change] += 1;
  return `new: ${counts.new}  changed: ${counts.changed}  same: ${counts.same}`;
}

export function renderDiff(entries: DiffEntry[]): string {
  const parts: string[] = [];
  for (const entry of entries) {
    if (entry.change === 'same') continue;
    const patch = createTwoFilesPatch(
      entry.relPath,
      entry.relPath,
      entry.targetContent ?? '',
      entry.payloadContent,
    );
    parts.push(colorizePatch(patch));
  }
  return parts.join('\n');
}

function colorizePatch(patch: string): string {
  return patch
    .split('\n')
    .map((line) => {
      if (line.startsWith('+') && !line.startsWith('+++')) return chalk.green(line);
      if (line.startsWith('-') && !line.startsWith('---')) return chalk.red(line);
      return line;
    })
    .join('\n');
}

export function renderFindings(findings: SecretFinding[]): string {
  return findings
    .map((f) => chalk.yellow(`${f.relPath}:${f.line}  pattern=/${f.pattern}/`))
    .join('\n');
}
