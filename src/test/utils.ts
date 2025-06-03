import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { DuplicateDependency, DependencyStats } from '../types.js';

export interface TestPackage {
  name: string;
  version: string;
  type?: 'module' | 'commonjs';
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  main?: string;
  exports?: Record<string, any>;
}

export interface TestPackageSetup {
  root: string;
  packages: TestPackage[];
}

export async function createTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'reporter-test-'));
}

export async function cleanupTempDir(dir: string): Promise<void> {
  await fs.rm(dir, {recursive: true, force: true});
}

export async function createTestPackage(
  root: string,
  pkg: TestPackage,
  options: {createNodeModules?: boolean} = {}
): Promise<void> {
  // Create package.json
  await fs.writeFile(
    path.join(root, 'package.json'),
    JSON.stringify(pkg, null, 2)
  );

  // Create node_modules if requested
  if (options.createNodeModules) {
    await fs.mkdir(path.join(root, 'node_modules'));
  }
}

export async function createTestPackageWithDependencies(
  root: string,
  pkg: TestPackage,
  dependencies: TestPackage[]
): Promise<void> {
  // Create root package
  await createTestPackage(root, pkg, {createNodeModules: true});

  // Create dependencies
  const nodeModules = path.join(root, 'node_modules');
  for (const dep of dependencies) {
    const depDir = path.join(nodeModules, dep.name);
    await fs.mkdir(depDir);
    await createTestPackage(depDir, dep);
  }
}

export function createMockTarball(files: Array<{name: string; content: any}>) {
  return {
    files: files.map((file) => ({
      name: file.name,
      data: new TextEncoder().encode(
        typeof file.content === 'string'
          ? file.content
          : JSON.stringify(file.content)
      )
    })),
    rootDir: 'package'
  };
}

export function generateReportOutput(dependencies: DependencyStats): string {
  const output: string[] = [];

  // Local Analysis section
  output.push('Local Analysis');
  output.push(`Total deps      ${dependencies.totalDependencies}`);
  output.push(`Direct deps     ${dependencies.directDependencies}`);
  output.push(`Dev deps        ${dependencies.devDependencies}`);
  output.push(`CJS deps        ${dependencies.cjsDependencies}`);
  output.push(`ESM deps        ${dependencies.esmDependencies}`);
  output.push(`Install size    ${formatBytes(dependencies.installSize)}`);
  output.push('');

  // Package info section
  output.push('Package info');
  output.push(`Name     ${dependencies.packageName}`);
  output.push(`Version  ${dependencies.version}`);
  output.push('');

  // Package report section
  output.push('Package report');
  
  // Display duplicate dependency warnings
  if (dependencies.duplicateDependencies && dependencies.duplicateDependencies.length > 0) {
    output.push('Duplicate Dependencies');
    dependencies.duplicateDependencies.forEach((dup: DuplicateDependency) => {
      output.push(`Package: ${dup.name}`);
      output.push(`Versions: ${dup.versions.join(', ')}`);
      output.push(`Locations: ${dup.locations.join(', ')}`);

      if (dup.relatedDuplicates && dup.relatedDuplicates.length > 0) {
        output.push(`Related duplicates: ${dup.relatedDuplicates.join(', ')}`);
      }

      if (dup.deduplicationImpact) {
        output.push(`Potential impact:`);
        output.push(`  - Size reduction: ${formatBytes(dup.deduplicationImpact.sizeReduction)}`);
        output.push(`  - Dependency count reduction: ${dup.deduplicationImpact.dependencyCountReduction}`);
      }

      output.push('Deduplication strategies:');
      dup.deduplicationStrategies.forEach(strategy => {
        output.push(`  - ${strategy.description} (${strategy.confidence} confidence)`);
        if (strategy.command) {
          output.push(`    Command: ${strategy.command}`);
        }
      });

      if (dup.suggestedFix) {
        output.push('Suggested Fix:');
        output.push(`  - ${dup.suggestedFix.reason}`);
        if (dup.suggestedFix.breakingChanges) {
          output.push('  - ⚠️  This upgrade may include breaking changes');
        }
        if (dup.suggestedFix.peerDependencies) {
          output.push('  - Peer dependencies:');
          Object.entries(dup.suggestedFix.peerDependencies).forEach(([dep, range]) => {
            output.push(`    - ${dep}: ${range}`);
          });
        }
      }
      output.push('');
    });
  } else {
    output.push('No duplicated dependencies were found.');
  }

  return output.join('\n');
}

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
