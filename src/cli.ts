#!/usr/bin/env node
import { Command } from 'commander';
import { cwd, stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config';
import { enumeratePayload } from './enumerator';
import { diffFiles } from './differ';
import { deploy } from './deployer';
import { importFromTarget } from './importer';
import { renderStatus, renderDiff, renderFindings } from './reporter';
import { buildDeployPlan } from './commands';
import { checkoutPreviousPayload } from './git';
import type { DeployRecord } from './types';

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question(`${question} (y/N) `)).trim().toLowerCase();
  rl.close();
  return answer === 'y' || answer === 'yes';
}

function writeDeployRecord(projectRoot: string, record: DeployRecord): void {
  const dir = join(projectRoot, '.defa');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'last-deploy.json'), JSON.stringify(record, null, 2));
}

export function buildProgram(): Command {
  const program = new Command();
  program.name('defa').description('External curation layer for ~/.claude/ global config');

  program
    .command('import')
    .description('Bootstrap payload from existing ~/.claude/ artifacts')
    .action(() => {
      const config = loadConfig(cwd());
      mkdirSync(config.payloadDir, { recursive: true });
      const imported = importFromTarget(config.targetRoot, config.payloadDir, config.managed);
      console.log(imported.length ? `Imported: ${imported.join(', ')}` : 'Nothing to import.');
    });

  program
    .command('status')
    .description('Summarize differences between payload and ~/.claude/')
    .action(async () => {
      const config = loadConfig(cwd());
      const relPaths = await enumeratePayload(config.payloadDir);
      const entries = diffFiles(config.payloadDir, config.targetRoot, relPaths);
      console.log(renderStatus(entries));
    });

  program
    .command('diff')
    .description('Dry-run: scan for secrets and show the diff without writing')
    .action(async () => {
      const config = loadConfig(cwd());
      const plan = await buildDeployPlan(config, true);
      if (plan.findings.length) {
        console.log(renderFindings(plan.findings));
        console.log('');
      }
      console.log(renderStatus(plan.entries));
      console.log(renderDiff(plan.entries));
    });

  program
    .command('deploy')
    .description('Scan, diff, confirm, then additively copy DEFA-owned files to ~/.claude/')
    .option('--force', 'proceed even if secrets are found', false)
    .action(async (opts: { force: boolean }) => {
      const config = loadConfig(cwd());
      const plan = await buildDeployPlan(config, opts.force);

      if (plan.findings.length) {
        console.log('Potential secrets found:');
        console.log(renderFindings(plan.findings));
        if (plan.blocked) {
          console.log('\nDeploy blocked. Re-run with --force to override.');
          return;
        }
      }

      console.log(renderStatus(plan.entries));
      console.log(renderDiff(plan.entries));

      if (!(await confirm('Apply these changes?'))) {
        console.log('Aborted.');
        return;
      }

      const written = deploy(config.payloadDir, config.targetRoot, plan.entries);
      writeDeployRecord(cwd(), { deployedAt: new Date().toISOString(), written });
      console.log(`Deployed ${written.length} file(s).`);
    });

  program
    .command('rollback')
    .description('Restore payload from the previous commit, then re-run deploy')
    .action(() => {
      checkoutPreviousPayload(cwd());
      console.log('Payload rolled back to previous commit. Run `defa deploy` to apply.');
    });

  return program;
}

// Only parse argv when executed directly (not when imported by tests).
// Resolves symlinks so the check holds for bins installed via `npm i -g`
// or `npm link`, where argv[1] is a symlink in node_modules/.bin/.
export function isDirectExecution(moduleUrl: string, argvPath: string | undefined): boolean {
  if (!argvPath) return false;
  try {
    return realpathSync(argvPath) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

if (isDirectExecution(import.meta.url, process.argv[1])) {
  buildProgram().parse();
}
