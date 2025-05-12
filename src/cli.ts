import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {cli, define} from 'gunshi';
import * as prompts from '@clack/prompts';
import c from 'picocolors';
import {report} from './index.js';
import type {Message, PackType} from './types.js';
import {LocalDependencyAnalyzer} from './analyze-dependencies.js';

// This is required if you want to display the list of files in the tarball
// eslint-disable-next-line no-var
declare global {
  // eslint-disable-next-line no-var
  var lastTarballFiles: string[] | undefined;
}

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

    const packageDir = root || process.cwd();

    // First analyze local dependencies
    const localAnalyzer = new LocalDependencyAnalyzer();
    const localStats = await localAnalyzer.analyzeDependencies(packageDir);

    prompts.log.info('Local Analysis');
    prompts.log.message(
      `${c.dim('Total deps    ')}  ${localStats.totalDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(
      `${c.dim('Direct deps   ')}  ${localStats.directDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(
      `${c.dim('Dev deps      ')}  ${localStats.devDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(
      `${c.dim('CJS deps      ')}  ${localStats.cjsDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(
      `${c.dim('ESM deps      ')}  ${localStats.esmDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(
      `${c.dim('Install size  ')}  ${formatBytes(localStats.installSize)}`,
      {spacing: 0}
    );
    prompts.log.message(
      c.gray(
        '(Dependency type analysis is based on your installed node_modules.)'
      ),
      {spacing: 1}
    );
    prompts.log.message('', {spacing: 0});

    // Then analyze the tarball
    const {messages, dependencies} = await report({root: packageDir, pack});

    // Information about which files are included in the tarball, which can be useful for debugging
    // This can be commented if we don't require this level of detail
    // Show files in tarball (styled)
    if (Array.isArray(globalThis.lastTarballFiles)) {
      prompts.log.info(c.white('Files in tarball:'), {spacing: 0});
      for (const file of globalThis.lastTarballFiles) {
        prompts.log.message(c.gray(`  - ${file}`), {spacing: 0});
      }
      prompts.log.message('', {spacing: 0});
    }

    prompts.log.info('Tarball Analysis');
    prompts.log.message(
      `${c.dim('Total deps    ')}  ${dependencies.totalDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(
      `${c.dim('Direct deps   ')}  ${dependencies.directDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(
      `${c.dim('Dev deps      ')}  ${dependencies.devDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(`${c.dim('CJS deps      ')}  N/A`, {spacing: 0});
    prompts.log.message(`${c.dim('ESM deps      ')}  N/A`, {spacing: 0});
    prompts.log.message(
      `${c.dim('Install size  ')}  ${formatBytes(dependencies.installSize)}`,
      {spacing: 0}
    );
    prompts.log.message(
      c.gray(
        'Dependency type analysis is only available for local analysis, as tarballs do not include dependencies.'
      ),
      {spacing: 1}
    );

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

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
