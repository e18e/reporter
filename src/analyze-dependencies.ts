import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import {unpack} from '@publint/pack';
import {analyzePackageModuleType} from './compute-type.js';
import {pino} from 'pino';
import type {DependencyStats, DependencyAnalyzer} from './types.js';
import {fdir} from 'fdir';

// Create a logger instance with pretty printing for development
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

/**
 * This file contains dependency analysis functionality.
 *
 * To enable debug logging for dependency analysis:
 * ```typescript
 * // Enable all debug logs
 * logger.level = 'debug';
 *
 * // Or create a specific logger for dependency analysis
 * const analyzerLogger = logger.child({ module: 'analyzer' });
 * analyzerLogger.level = 'debug';
 * ```
 */

// Re-export types
export type {DependencyStats, DependencyAnalyzer};

export class LocalDependencyAnalyzer implements DependencyAnalyzer {
  async analyzeDependencies(root: string): Promise<DependencyStats> {
    try {
      const pkgJsonPath = path.join(root, 'package.json');
      logger.debug('Reading package.json from:', pkgJsonPath);

      const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));

      // Count direct dependencies
      const directDependencies = Object.keys(pkgJson.dependencies || {}).length;
      const devDependencies = Object.keys(pkgJson.devDependencies || {}).length;

      logger.debug('Direct dependencies:', directDependencies);
      logger.debug('Dev dependencies:', devDependencies);

      // Analyze node_modules
      let cjsDependencies = 0;
      let esmDependencies = 0;
      let installSize = 0;

      // Walk through node_modules
      const nodeModulesPath = path.join(root, 'node_modules');

      try {
        await fs.access(nodeModulesPath);
        logger.debug('Found node_modules directory');

        await this.walkNodeModules(nodeModulesPath, {
          onPackage: (pkgJson) => {
            const type = analyzePackageModuleType(pkgJson);
            logger.debug(
              `Package ${pkgJson.name}: ${type} (type=${pkgJson.type}, main=${pkgJson.main}, exports=${JSON.stringify(pkgJson.exports)})`
            );

            if (type === 'cjs') cjsDependencies++;
            if (type === 'esm') esmDependencies++;
            if (type === 'dual') {
              cjsDependencies++;
              esmDependencies++;
            }
          },
          onFile: (filePath) => {
            try {
              const stats = fsSync.statSync(filePath);
              installSize += stats.size;
            } catch {
              logger.debug('Error getting file stats for:', filePath);
            }
          }
        });
      } catch {
        logger.debug('No node_modules directory found');
      }

      logger.debug('Analysis complete:');
      logger.debug('- CJS dependencies:', cjsDependencies);
      logger.debug('- ESM dependencies:', esmDependencies);
      logger.debug('- Install size:', installSize, 'bytes');

      return {
        totalDependencies: directDependencies + devDependencies,
        directDependencies,
        devDependencies,
        cjsDependencies,
        esmDependencies,
        installSize,
        packageName: pkgJson.name,
        version: pkgJson.version
      };
    } catch (error) {
      logger.error('Error analyzing dependencies:', error);
      throw error;
    }
  }

  private async walkNodeModules(
    dir: string,
    callbacks: {
      onPackage: (pkgJson: any) => void;
      onFile: (filePath: string) => void;
    },
    seenPackages = new Set<string>()
  ) {
    try {
      const crawler = new fdir().withFullPaths().withSymlinks().crawl(dir);

      const files = await crawler.withPromise();

      for (const filePath of files) {
        // Handle package.json files
        if (filePath.endsWith('/package.json')) {
          try {
            const pkgJson = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            if (!seenPackages.has(pkgJson.name)) {
              seenPackages.add(pkgJson.name);
              logger.debug('Detected package:', pkgJson.name, 'at', filePath);
              callbacks.onPackage(pkgJson);
            } else {
              logger.debug(
                'Already seen package:',
                pkgJson.name,
                'at',
                filePath
              );
            }
          } catch {
            logger.debug('Error reading package.json:', filePath);
          }
        } else {
          // Handle regular files
          callbacks.onFile(filePath);
        }
      }
    } catch (error) {
      logger.debug('Error walking directory:', dir, error);
    }
  }
}

// Keep the existing tarball analysis for backward compatibility
export async function analyzeDependencies(
  tarball: ArrayBuffer
): Promise<DependencyStats> {
  const {files, rootDir} = await unpack(tarball);
  const decoder = new TextDecoder();

  // Debug: Log all files in the tarball
  logger.debug('Files in tarball:');
  for (const file of files) {
    logger.debug(`- ${file.name}`);
  }

  // Find package.json
  const pkgJson = files.find((f) => f.name === rootDir + '/package.json');
  if (!pkgJson) {
    throw new Error('No package.json found in the tarball.');
  }

  const pkg = JSON.parse(decoder.decode(pkgJson.data));

  // Calculate total size
  const installSize = files.reduce(
    (acc, file) => acc + file.data.byteLength,
    0
  );

  // Count dependencies
  const directDependencies = Object.keys(pkg.dependencies || {}).length;
  const devDependencies = Object.keys(pkg.devDependencies || {}).length;

  // Count CJS vs ESM dependencies
  let cjsDependencies = 0;
  let esmDependencies = 0;

  // Analyze each dependency
  for (const file of files) {
    if (file.name.endsWith('/package.json')) {
      try {
        const depPkg = JSON.parse(decoder.decode(file.data));
        const type = analyzePackageModuleType(depPkg);
        if (type === 'cjs') cjsDependencies++;
        if (type === 'esm') esmDependencies++;
        if (type === 'dual') {
          cjsDependencies++;
          esmDependencies++;
        }
      } catch {
        // Skip invalid package.json files
      }
    }
  }

  return {
    totalDependencies: directDependencies + devDependencies,
    directDependencies,
    devDependencies,
    cjsDependencies,
    esmDependencies,
    installSize,
    packageName: pkg.name,
    version: pkg.version,
    tarballFiles: files.map((f) => f.name)
  };
}
