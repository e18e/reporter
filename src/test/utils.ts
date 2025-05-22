import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

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
