import {unpack} from '@publint/pack';
import {analyzePackageModuleType} from './compute-type.js';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

export interface DependencyStats {
  totalDependencies: number;
  directDependencies: number;
  devDependencies: number;
  cjsDependencies: number;
  esmDependencies: number;
  installSize: number; // in bytes
}

export interface DependencyAnalyzer {
  analyzeDependencies(root: string): Promise<DependencyStats>;
}

export class LocalDependencyAnalyzer implements DependencyAnalyzer {
  async analyzeDependencies(root: string): Promise<DependencyStats> {
    try {
      const pkgJsonPath = path.join(root, 'package.json');
      // this.log('Reading package.json from:', pkgJsonPath);

      const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));

      // Count direct dependencies
      const directDependencies = Object.keys(pkgJson.dependencies || {}).length;
      const devDependencies = Object.keys(pkgJson.devDependencies || {}).length;

      // this.log('Direct dependencies:', directDependencies);
      // this.log('Dev dependencies:', devDependencies);

      // Analyze node_modules
      let cjsDependencies = 0;
      let esmDependencies = 0;
      let installSize = 0;

      // Walk through node_modules
      const nodeModulesPath = path.join(root, 'node_modules');

      try {
        await fs.access(nodeModulesPath);
        // this.log('Found node_modules directory');

        await this.walkNodeModules(nodeModulesPath, {
          onPackage: (pkgJson) => {
            const type = analyzePackageModuleType(pkgJson);
            // this.log(`Package ${pkgJson.name}: ${type} (type=${pkgJson.type}, main=${pkgJson.main}, exports=${JSON.stringify(pkgJson.exports)})`);

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
              // this.log('Error getting file stats for:', filePath);
            }
          }
        });
      } catch {
        // this.log('No node_modules directory found');
      }

      // this.log('Analysis complete:');
      // this.log('- CJS dependencies:', cjsDependencies);
      // this.log('- ESM dependencies:', esmDependencies);
      // this.log('- Install size:', installSize, 'bytes');

      return {
        totalDependencies: directDependencies + devDependencies,
        directDependencies,
        devDependencies,
        cjsDependencies,
        esmDependencies,
        installSize
      };
    } catch {
      // this.log('Error analyzing dependencies');
      throw new Error('Error analyzing dependencies');
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
      const entries = await fs.readdir(dir, {withFileTypes: true});

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Handle symlinks
        if (entry.isSymbolicLink()) {
          try {
            const realPath = await fs.realpath(fullPath);
            // this.log('Found symlink:', fullPath, '->', realPath);
            // If the real path is a package, process it
            const pkgJsonPath = path.join(realPath, 'package.json');
            try {
              const pkgJson = JSON.parse(
                await fs.readFile(pkgJsonPath, 'utf-8')
              );
              if (!seenPackages.has(pkgJson.name)) {
                seenPackages.add(pkgJson.name);
                // this.log('Detected package (symlink):', pkgJson.name, 'at', realPath);
                callbacks.onPackage(pkgJson);
              } else {
                // this.log('Already seen package (symlink):', pkgJson.name, 'at', realPath);
              }
            } catch {
              // Not a package or can't read package.json, continue
            }
            // Only follow symlinks that point to node_modules
            if (realPath.includes('node_modules')) {
              // this.log('Following symlink to:', realPath);
              await this.walkNodeModules(realPath, callbacks, seenPackages);
            }
          } catch {
            // this.log('Error resolving symlink:', fullPath);
          }
          continue;
        }

        if (entry.isDirectory()) {
          // Check if this is a package directory
          const pkgJsonPath = path.join(fullPath, 'package.json');
          try {
            const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
            // Only process each package once
            if (!seenPackages.has(pkgJson.name)) {
              seenPackages.add(pkgJson.name);
              // this.log('Detected package:', pkgJson.name, 'at', fullPath);
              callbacks.onPackage(pkgJson);
            } else {
              // this.log('Already seen package:', pkgJson.name, 'at', fullPath);
            }
          } catch {
            // Not a package or can't read package.json, continue walking
          }

          // Continue walking if it's not node_modules
          if (entry.name !== 'node_modules') {
            await this.walkNodeModules(fullPath, callbacks, seenPackages);
          }
        } else {
          callbacks.onFile(fullPath);
        }
      }
    } catch {
      // this.log('Error walking directory:', dir);
    }
  }
}

export class RemoteDependencyAnalyzer implements DependencyAnalyzer {
  async analyzeDependencies(root: string): Promise<DependencyStats> {
    const pkgJsonPath = path.join(root, 'package.json');
    const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));

    // Count direct dependencies
    const directDependencies = Object.keys(pkgJson.dependencies || {}).length;
    const devDependencies = Object.keys(pkgJson.devDependencies || {}).length;

    // Analyze dependencies from npm registry
    const cjsDependencies = 0;
    const esmDependencies = 0;
    const installSize = 0;

    // TODO: Implement npm registry fetching
    // For each dependency:
    // 1. Fetch package metadata from registry
    // 2. Analyze module type
    // 3. Fetch tarball and calculate size

    return {
      totalDependencies: directDependencies + devDependencies,
      directDependencies,
      devDependencies,
      cjsDependencies,
      esmDependencies,
      installSize
    };
  }
}

// Keep the existing tarball analysis for backward compatibility
export async function analyzeDependencies(
  tarball: ArrayBuffer
): Promise<DependencyStats> {
  const {files, rootDir} = await unpack(tarball);
  const decoder = new TextDecoder();

  // Set global tarball file list for CLI display
  globalThis.lastTarballFiles = files.map((f) => f.name);

  // Debug: Log all files in the tarball
  // console.log('Files in tarball:');
  // for (const file of files) {
  //   console.log(`- ${file.name}`);
  // }

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
        console.log(
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
    installSize
  };
}
