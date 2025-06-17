import {createRequire} from 'node:module';
import {cli, define, lazy, type LazyCommand} from 'gunshi';
import * as prompts from '@clack/prompts';
import c from 'picocolors';
import {meta as analyzeMeta} from './commands/analyze.meta.js';
import {meta as migrateMeta} from './commands/migrate.meta.js';

const version = createRequire(import.meta.url)('../package.json').version;

// Create a logger instance with pretty printing for development

const defaultCommand = define({
  args: {},
  async run() {
    prompts.intro('Please choose a command to run:');
    prompts.log.message(
      [
        `--analyze (${c.dim('analyzes the package for warnings/errors')})`,
        `--migrate (${c.dim('migrates packages to their suggested alternatives')})`
      ].join('\n')
    );
    prompts.outro(
      'Use `<command> --help` to read more about a specific command'
    );
  }
});

const analyzeCommand = async () => {
  const {run} = await import('./commands/analyze.js');
  return run;
};
const migrateCommand = async () => {
  const {run} = await import('./commands/migrate.js');
  return run;
};

const subCommands = new Map<string, LazyCommand<any>>([
  // TODO (43081j): get rid of these casts
  ['analyze', lazy(analyzeCommand, analyzeMeta) as LazyCommand<any>],
  ['migrate', lazy(migrateCommand, migrateMeta) as LazyCommand<any>]
]);

cli(process.argv.slice(2), defaultCommand, {
  name: 'e18e-report',
  version,
  description: `${c.cyan('e18e CLI')}`,
  subCommands
});
