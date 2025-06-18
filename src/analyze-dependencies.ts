import {analyzePackageModuleType} from './compute-type.js';
import {pino} from 'pino';
import type {
  DependencyStats,
  DependencyAnalyzer,
  PackageJsonLike
} from './types.js';
import {FileSystem} from './file-system.js';

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

// Keep the existing tarball analysis for backward compatibility
export async function analyzeDependencies(
  fileSystem: FileSystem
): Promise<DependencyStats> {
  const packageFiles = await fileSystem.listPackageFiles();
  const rootDir = await fileSystem.getRootDir();

  // Debug: Log all files in the tarball
  logger.debug('Package.json files:');
  for (const file of packageFiles) {
    logger.debug(`- ${file}`);
  }

  // Find package.json
  let pkg: PackageJsonLike;

  try {
    pkg = JSON.parse(await fileSystem.readFile(rootDir + '/package.json'));
  } catch {
    throw new Error('No package.json found.');
  }

  // Calculate total size
  const installSize = await fileSystem.getInstallSize();

  // Count dependencies
  const directDependencies = Object.keys(pkg.dependencies || {}).length;
  const devDependencies = Object.keys(pkg.devDependencies || {}).length;

  // Count CJS vs ESM dependencies
  let cjsDependencies = 0;
  let esmDependencies = 0;

  // Analyze each dependency
  for (const file of packageFiles) {
    if (file === rootDir + '/package.json') {
      continue;
    }

    try {
      const depPkg = JSON.parse(await fileSystem.readFile(file));
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

  return {
    totalDependencies: directDependencies + devDependencies,
    directDependencies,
    devDependencies,
    cjsDependencies,
    esmDependencies,
    installSize,
    packageName: pkg.name,
    version: pkg.version
  };
}
