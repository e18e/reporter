import {unpack} from '@publint/pack';
import {analyzePackageModuleType} from './compute-type.js';
import { logger } from './logger.js';
import type {DependencyStats, DependencyAnalyzer} from './types.js';

export class LocalDependencyAnalyzer implements DependencyAnalyzer {
  async analyzeDependencies(): Promise<DependencyStats> {
    throw new Error('Local dependency analysis is not supported in the browser');
  }
}

export class RemoteDependencyAnalyzer implements DependencyAnalyzer {
  async analyzeDependencies(): Promise<DependencyStats> {
    throw new Error('Remote dependency analysis is not supported in the browser');
  }
}

// Keep the existing tarball analysis for backward compatibility
export async function analyzeDependencies(
  tarball: ArrayBuffer
): Promise<DependencyStats> {
  const {files, rootDir} = await unpack(tarball);
  const decoder = new TextDecoder();

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
  const seenPackages = new Set<string>();

  // Look for package.json files in node_modules to determine module type
  for (const file of files) {
    if (
      file.name.endsWith('/package.json') &&
      file.name.includes('node_modules/')
    ) {
      const depPkg = JSON.parse(decoder.decode(file.data));
      // Only process each package once
      if (!seenPackages.has(depPkg.name)) {
        seenPackages.add(depPkg.name);
        const type = analyzePackageModuleType(depPkg);
        logger.debug(
          `Package ${depPkg.name}: ${type} (type=${depPkg.type}, main=${depPkg.main}, exports=${JSON.stringify(depPkg.exports)})`
        );
        if (type === 'cjs') cjsDependencies++;
        if (type === 'esm') esmDependencies++;
        if (type === 'dual') {
          cjsDependencies++;
          esmDependencies++;
        }
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
    tarballFiles: files.map((f) => f.name)
  };
} 