import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {cli, define} from 'gunshi';
import * as prompts from '@clack/prompts';
import c from 'picocolors';
import {report} from './index.js';
import type {PackType} from './types.js';
import {LocalDependencyAnalyzer} from './analyze-dependencies.js';

const version = createRequire(import.meta.url)('../package.json').version;
const allowedPackTypes: PackType[] = ['auto', 'npm', 'yarn', 'pnpm', 'bun'];

const defaultCommand = define({
  options: {
    pack: {
      type: 'string',
      default: 'auto',
      description: `Package manager to use for packing ('auto' | 'npm' | 'yarn' | 'pnpm' | 'bun')`
    },
    'list-tarball-files': {
      type: 'boolean',
      default: false,
      description: 'List all files in the tarball',
    }
  },
  async run(ctx) {
    const root = ctx.positionals[0];
    let pack = ctx.values.pack as PackType;
    const showAllFiles = ctx.values['list-tarball-files'] as boolean;

    prompts.intro('Generating report...');

    if (typeof pack === 'string' && !allowedPackTypes.includes(pack)) {
      prompts.cancel(
        `Invalid '--pack' option. Allowed values are: ${allowedPackTypes.join(', ')}`
      );
      throw new Error('Invalid --pack option');
    }

    // If a path is passed, see if it's a path to a file (likely the tarball file)
    let isTarball = false;
    if (root) {
      try {
        const stat = await fs.stat(root);
        if (stat.isFile()) {
          const buffer = await fs.readFile(root);
          pack = {tarball: buffer.buffer};
          isTarball = true;
        } else if (!stat.isDirectory()) {
          prompts.cancel(
            `When '--pack file' is used, a path to a tarball file must be passed.`
          );
          throw new Error('When --pack file is used, a path to a tarball file must be passed.');
        }
      } catch (error) {
        prompts.cancel(
          `Failed to read tarball file: ${error instanceof Error ? error.message : String(error)}`
        );
        throw error;
      }
    }

    const packageDir = root || process.cwd();

    // Only run local analysis if the root is not a tarball file
    if (!isTarball) {
      const localAnalyzer = new LocalDependencyAnalyzer();
      const localStats = await localAnalyzer.analyzeDependencies(packageDir);

      prompts.log.info('Local Analysis');
      prompts.log.message(
        `${c.cyan('Total deps    ')}  ${localStats.totalDependencies}`,
        {spacing: 0}
      );
      prompts.log.message(
        `${c.cyan('Direct deps   ')}  ${localStats.directDependencies}`,
        {spacing: 0}
      );
      prompts.log.message(
        `${c.cyan('Dev deps      ')}  ${localStats.devDependencies}`,
        {spacing: 0}
      );
      prompts.log.message(
        `${c.cyan('CJS deps      ')}  ${localStats.cjsDependencies}`,
        {spacing: 0}
      );
      prompts.log.message(
        `${c.cyan('ESM deps      ')}  ${localStats.esmDependencies}`,
        {spacing: 0}
      );
      prompts.log.message(
        `${c.cyan('Install size  ')}  ${formatBytes(localStats.installSize)}`,
        {spacing: 0}
      );
      prompts.log.message(
        c.yellowBright(
          'Dependency type analysis is based on your installed node_modules.'
        ),
        {spacing: 1}
      );
      prompts.log.message('', {spacing: 0});

      // Display package info
      prompts.log.info('Package info');
      prompts.log.message(`${c.cyan('Name   ')}  ${localStats.packageName}`, {spacing: 0});
      prompts.log.message(`${c.cyan('Version')}  ${localStats.version}`, {spacing: 0});
      prompts.log.message('', {spacing: 0});
    }

    // Then analyze the tarball
    const {dependencies} = await report({root: packageDir, pack});

    // Show files in tarball (styled) only if requested
    if (showAllFiles && Array.isArray(dependencies.tarballFiles)) {
      prompts.log.info(c.white('Files in tarball:'), {spacing: 0});
      for (const file of dependencies.tarballFiles) {
        prompts.log.message(c.gray(`  - ${file}`), {spacing: 0});
      }
      prompts.log.message('', {spacing: 1});
    }

    prompts.log.info('Tarball Analysis');
    prompts.log.message(
      `${c.cyan('Total deps    ')}  ${dependencies.totalDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(
      `${c.cyan('Direct deps   ')}  ${dependencies.directDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(
      `${c.cyan('Dev deps      ')}  ${dependencies.devDependencies}`,
      {spacing: 0}
    );
    prompts.log.message(`${c.cyan('CJS deps      ')}  N/A`, {spacing: 0});
    prompts.log.message(`${c.cyan('ESM deps      ')}  N/A`, {spacing: 0});
    prompts.log.message(
      `${c.cyan('Install size  ')}  ${formatBytes(dependencies.installSize)}`,
      {spacing: 0}
    );
    prompts.log.message(
      c.yellowBright(
        'Dependency type analysis is only available for local analysis, as tarballs do not include dependencies.'
      ),
      {spacing: 1}
    );

    prompts.log.info('Package report');
    prompts.log.message(
      c.yellowBright(
        'This is a preview of the package report. The full report will be available soon.'
      ),
      {spacing: 1}
    );

    prompts.outro('Report generated successfully!');
  }
});

function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

cli(process.argv.slice(2), defaultCommand, {
  name: 'e18e-report',
  version,
  description: 'Generate a performance report for your package.'
});
