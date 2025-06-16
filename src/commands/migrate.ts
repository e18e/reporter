import {type CommandContext} from 'gunshi';
import * as prompts from '@clack/prompts';
import {meta} from './migrate.meta.js';
import {codemods} from 'module-replacements-codemods';
import {glob} from 'tinyglobby';
import {readFile, writeFile} from 'node:fs/promises';

interface Replacement {
  from: string;
  to: string;
  factory: (typeof codemods)[keyof typeof codemods];
}

const fixableReplacements: Replacement[] = [
  {
    from: 'chalk',
    to: 'picocolors',
    factory: codemods.chalk
  }
];

export async function run(ctx: CommandContext<typeof meta.args>) {
  const [_commandName, ...targetModules] = ctx.positionals;
  const dryRun = ctx.values['dry-run'] === false;

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

  prompts.log.message(`Reading files from ${cwd}...`);

  const files = await glob('**/*.ts', {
    cwd,
    absolute: true
  });

  for (const replacement of selectedReplacements) {
    const log = prompts.taskLog({
      title: `Migrating from ${replacement.from} to ${replacement.to}...`,
      limit: 5
    });
    for (const filename of files) {
      log.message(`Loading file ${filename}`);
      const source = await readFile(filename, 'utf8');
      log.message(`Transforming file ${filename}`);
      // TODO (43081j): create the factory once and re-use it
      const result = await replacement.factory({}).transform({
        file: {
          filename,
          source
        }
      });
      log.message(`Writing file ${filename}`);
      if (!dryRun) {
        await writeFile(filename, result, 'utf8');
      }
    }
    log.success(
      `Migrated from ${replacement.from} to ${replacement.to} successfully.`
    );
  }

  prompts.outro('All packages migrated!');
}
