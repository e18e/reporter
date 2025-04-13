import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {cli, define} from 'gunshi';
import * as prompts from '@clack/prompts';
import c from 'picocolors';
import {report} from './index.js';
import type {Message, PackType} from './types.js';

const version = createRequire(import.meta.url)('../package.json').version;
const allowedPackTypes: PackType[] = ['auto', 'npm', 'yarn', 'pnpm', 'bun'];

const defaultCommand = define({
  options: {
    pack: {
      type: 'string',
      default: 'auto',
      description: `Package manager to use for packing ('auto' | 'npm' | 'yarn' | 'pnpm' | 'bun')`
    }
  },
  async run(ctx) {
    const root = ctx.positionals[0];
    let pack = ctx.values.pack as PackType;

    prompts.intro('Generating report...');

    if (typeof pack === 'string' && !allowedPackTypes.includes(pack)) {
      prompts.cancel(
        `Invalid '--pack' option. Allowed values are: ${allowedPackTypes.join(', ')}`
      );
      process.exit(1);
    }

    // If a path is passed, see if it's a path to a file (likely the tarball file)
    if (root) {
      const stat = await fs.stat(root).catch(() => {});
      const isTarballFilePassed = stat?.isFile() === true;
      if (!isTarballFilePassed) {
        prompts.cancel(
          `When '--pack file' is used, a path to a tarball file must be passed.`
        );
        process.exit(1);
      }
      pack = {tarball: (await fs.readFile(root)).buffer};
    }

    const {info, messages} = await report({root, pack});

    prompts.log.info('Package info');
    prompts.log.message(`${c.dim('Name   ')}  ${info.name}`, {spacing: 0});
    prompts.log.message(`${c.dim('Version')}  ${info.version}`, {spacing: 0});
    prompts.log.message(`${c.dim('Type   ')}  ${info.type.toUpperCase()}`, {
      spacing: 0
    });

    prompts.log.info('Package report');

    if (messages.length === 0) {
      prompts.outro('All good!');
    } else {
      outputMessages(messages);
      prompts.outro('Report found some issues.');
      process.exitCode = 1;
    }
  }
});

await cli(process.argv.slice(2), defaultCommand, {
  name: 'e18e-report',
  version,
  description: 'Generate a performance report for your package.'
});

function outputMessages(messages: Message[]) {
  const errors = messages.filter((v) => v.severity === 'error');
  if (errors.length) {
    prompts.log.error('Errors found');
    for (let i = 0; i < errors.length; i++) {
      const m = errors[i];
      prompts.log.message(c.dim(`${i + 1}. `) + m.message, {spacing: 0});
    }
    process.exitCode = 1;
  }

  const warnings = messages.filter((v) => v.severity === 'warning');
  if (warnings.length) {
    prompts.log.warning('Warnings found');
    for (let i = 0; i < warnings.length; i++) {
      const m = warnings[i];
      prompts.log.message(c.dim(`${i + 1}. `) + m.message, {spacing: 0});
    }
  }

  const suggestions = messages.filter((v) => v.severity === 'suggestion');
  if (suggestions.length) {
    prompts.log.info('Suggestions found');
    for (let i = 0; i < suggestions.length; i++) {
      const m = suggestions[i];
      prompts.log.message(c.dim(`${i + 1}. `) + m.message, {spacing: 0});
    }
  }
}
