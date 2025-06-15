import {type CommandContext} from 'gunshi';
import * as prompts from '@clack/prompts';
import {meta} from './migrate.meta.js';
import {Codemod, codemods} from 'module-replacements-codemods';
import {glob} from 'tinyglobby';
import {readFile, writeFile} from 'node:fs/promises';

const allowedPackages = Object.keys(codemods);

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

  const factories = new Map<string, Codemod>();

  for (const targetModule of targetModules) {
    if (!allowedPackages.includes(targetModule)) {
      prompts.cancel(
        `Error: Unknown target package specified: ${targetModule}.`
      );
      return;
    }

    factories.set(targetModule, codemods[targetModule]({}));
  }

  const cwd = ctx.env.cwd ?? process.cwd();

  prompts.log.message(`Reading files from ${cwd}...`);

  const files = await glob('**/*.ts', {
    cwd,
    absolute: true
  });

  for (const [targetModule, codemod] of factories) {
    const log = prompts.taskLog({
      // TODO (43081j): how do we know what we're migrating to?
      title: `Migrating from ${targetModule} to ???...`,
      limit: 5
    });
    for (const filename of files) {
      log.message(`Loading file ${filename}`);
      const source = await readFile(filename, 'utf8');
      log.message(`Transforming file ${filename}`);
      const result = await codemod.transform({
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
    // TODO (43081j): how do we know what we're migrating to?
    log.success(`Migrated from ${targetModule} to ??? successfully.`);
  }

  prompts.outro('All packages migrated!');
}
