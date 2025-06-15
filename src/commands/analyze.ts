import {type CommandContext} from 'gunshi';
import fs from 'node:fs/promises';
import * as prompts from '@clack/prompts';
import {pino} from 'pino';
import c from 'picocolors';
import {meta} from './analyze.meta.js';
import {report} from '../index.js';
import type {PackType} from '../types.js';
import {LocalDependencyAnalyzer} from '../analyze-dependencies.js';

const allowedPackTypes: PackType[] = ['auto', 'npm', 'yarn', 'pnpm', 'bun'];
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
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

export async function run(ctx: CommandContext<typeof meta.args>) {
  const root = ctx.positionals[1];
  let pack: PackType = ctx.values.pack;
  const logLevel = ctx.values['log-level'];

  // Set the logger level based on the option
  logger.level = logLevel;

  prompts.intro('Generating report...');

  if (typeof pack === 'string' && !allowedPackTypes.includes(pack)) {
    prompts.cancel(
      `Invalid '--pack' option. Allowed values are: ${allowedPackTypes.join(', ')}`
    );
    process.exit(1);
  }

  // If a path is passed, it must be a tarball file
  let isTarball = false;
  if (root) {
    try {
      const stat = await fs.stat(root);
      if (stat.isFile()) {
        const buffer = await fs.readFile(root);
        pack = {tarball: buffer.buffer};
        isTarball = true;
      } else {
        // Not a file, exit
        prompts.cancel(
          `When '--pack file' is used, a path to a tarball file must be passed.`
        );
        process.exit(1);
      }
    } catch (error) {
      prompts.cancel(
        `Failed to read tarball file: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  }

  // Only run local analysis if the root is not a tarball file
  if (!isTarball) {
    const resolvedRoot = root || process.cwd();
    const localAnalyzer = new LocalDependencyAnalyzer();
    const localStats = await localAnalyzer.analyzeDependencies(resolvedRoot);

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
    prompts.log.message(`${c.cyan('Name   ')}  ${localStats.packageName}`, {
      spacing: 0
    });
    prompts.log.message(`${c.cyan('Version')}  ${localStats.version}`, {
      spacing: 0
    });
    prompts.log.message('', {spacing: 0});
  }

  // Then analyze the tarball
  const {dependencies, messages} = await report({root, pack});

  // Show files in tarball as debug output
  if (Array.isArray(dependencies.tarballFiles)) {
    logger.debug('Files in tarball:');
    for (const file of dependencies.tarballFiles) {
      logger.debug(`  - ${file}`);
    }
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
  prompts.log.message('', {spacing: 0});
  // Display tool analysis results
  if (messages.length > 0) {
    const errorMessages = messages.filter((m) => m.severity === 'error');
    const warningMessages = messages.filter((m) => m.severity === 'warning');
    const suggestionMessages = messages.filter(
      (m) => m.severity === 'suggestion'
    );

    // Display errors
    if (errorMessages.length > 0) {
      prompts.log.message(c.red('Errors:'), {spacing: 0});
      for (const msg of errorMessages) {
        prompts.log.message(`  ${c.red('•')} ${msg.message}`, {spacing: 0});
      }
      prompts.log.message('', {spacing: 0});
    }

    // Display warnings
    if (warningMessages.length > 0) {
      prompts.log.message(c.yellow('Warnings:'), {spacing: 0});
      for (const msg of warningMessages) {
        prompts.log.message(`  ${c.yellow('•')} ${msg.message}`, {spacing: 0});
      }
      prompts.log.message('', {spacing: 0});
    }

    // Display suggestions
    if (suggestionMessages.length > 0) {
      prompts.log.message(c.blue('Suggestions:'), {spacing: 0});
      for (const msg of suggestionMessages) {
        prompts.log.message(`  ${c.blue('•')} ${msg.message}`, {spacing: 0});
      }
      prompts.log.message('', {spacing: 0});
    }
  }
  prompts.outro('Report generated successfully!');
}
