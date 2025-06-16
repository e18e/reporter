import {type CommandContext} from 'gunshi';
import * as prompts from '@clack/prompts';
import colors from 'picocolors';
import {meta} from './migrate.meta.js';
import {glob} from 'tinyglobby';
import {readFile, writeFile} from 'node:fs/promises';
import { fixableReplacements } from './fixable-replacements.js';
import type { Replacement } from '../types.js';

export async function run(ctx: CommandContext<typeof meta.args>) {
  const [_commandName, ...targetModules] = ctx.positionals;
  const dryRun = ctx.values['dry-run'] === true;

  prompts.intro(`Migrating packages...`);

  if (targetModules.length === 0) {
    prompts.cancel(
      'Error: Please specify a package to migrate. For example, `migrate chalk`'
    );
    return;
  }

  const selectedReplacements: Replacement[] = [];

  for (const targetModule of targetModules) {
    const replacement = fixableReplacements.find(
      (rep) => rep.from === targetModule
    );
    if (!replacement) {
      prompts.cancel(
        `Error: Target package has no available migrations (${targetModule})`
      );
      return;
    }

    selectedReplacements.push(replacement);
  }

  const cwd = ctx.env.cwd ?? process.cwd();

  prompts.log.message(`Reading files from ${cwd}`);

  const files = await glob('**/*.ts', {
    cwd,
    absolute: true
  });

  for (const filename of files) {
    const log = prompts.taskLog({
      title: `${filename}...`,
      limit: 5
    });

    log.message(`loading ${filename}`);

    const source = await readFile(filename, 'utf8');

    let totalMigrations = 0;

    for (const replacement of selectedReplacements) {
      if (
        replacement.condition !== undefined &&
        (await replacement.condition(filename, source)) === false
      ) {
        continue;
      }

      log.message(`migrating ${replacement.from} to ${replacement.to}`);
      // TODO (43081j): create the factory once and re-use it
      const result = await replacement.factory.transform({ file: { source, filename } });
      log.message(`writing ${filename}`);
      if (!dryRun) {
        await writeFile(filename, result, 'utf8');
      }
      totalMigrations++;
    }
    log.success(`${filename} ${colors.dim(`(${totalMigrations} migrated)`)}`);
  }

  prompts.outro('Migration complete.');
}
