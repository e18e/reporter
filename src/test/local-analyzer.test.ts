import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {LocalDependencyAnalyzer} from '../analyze-dependencies.js';
import {
  createTempDir,
  cleanupTempDir,
  createTestPackage,
  createTestPackageWithDependencies,
  type TestPackage
} from './utils.js';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('LocalDependencyAnalyzer', () => {
  let tempDir: string;
  let analyzer: LocalDependencyAnalyzer;

  beforeEach(async () => {
    tempDir = await createTempDir();
    analyzer = new LocalDependencyAnalyzer();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it('should handle empty project', async () => {
    await createTestPackage(tempDir, {
      name: 'test-package',
      version: '1.0.0'
    });

    const stats = await analyzer.analyzeDependencies(tempDir);
    expect(stats).toEqual({
      totalDependencies: 0,
      directDependencies: 0,
      devDependencies: 0,
      cjsDependencies: 0,
      esmDependencies: 0,
      installSize: 0,
      packageName: 'test-package',
      version: '1.0.0'
    });
  });

  it('should analyze dependencies correctly', async () => {
    const rootPackage: TestPackage = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        'cjs-package': '1.0.0',
        'esm-package': '1.0.0'
      },
      devDependencies: {
        'dev-package': '1.0.0'
      }
    };

    const dependencies: TestPackage[] = [
      {
        name: 'cjs-package',
        version: '1.0.0',
        main: 'index.js',
        type: 'commonjs'
      },
      {
        name: 'esm-package',
        version: '1.0.0',
        type: 'module',
        exports: {
          '.': {
            import: './index.js'
          }
        }
      },
      {
        name: 'dev-package',
        version: '1.0.0',
        type: 'commonjs'
      }
    ];

    await createTestPackageWithDependencies(tempDir, rootPackage, dependencies);

    const stats = await analyzer.analyzeDependencies(tempDir);
    expect(stats).toEqual({
      totalDependencies: 3,
      directDependencies: 2,
      devDependencies: 1,
      cjsDependencies: 2, // cjs-package and dev-package
      esmDependencies: 1, // esm-package
      installSize: expect.any(Number),
      packageName: 'test-package',
      version: '1.0.0'
    });
  });

  it('should handle symlinks', async () => {
    // Create root package
    await createTestPackage(
      tempDir,
      {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'linked-package': '1.0.0'
        }
      },
      {createNodeModules: true}
    );

    // Create a package that will be linked
    const realPkg = path.join(tempDir, 'real-package');
    await fs.mkdir(realPkg);
    await createTestPackage(realPkg, {
      name: 'linked-package',
      version: '1.0.0',
      type: 'module'
    });

    // Create a symlink to the real package
    await fs.symlink(
      realPkg,
      path.join(tempDir, 'node_modules', 'linked-package'),
      'dir'
    );

    const stats = await analyzer.analyzeDependencies(tempDir);
    expect(stats).toEqual({
      totalDependencies: 1,
      directDependencies: 1,
      devDependencies: 0,
      cjsDependencies: 0,
      esmDependencies: 1,
      installSize: expect.any(Number),
      packageName: 'test-package',
      version: '1.0.0'
    });
  });

  it('should handle missing node_modules', async () => {
    await createTestPackage(tempDir, {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        'some-package': '1.0.0'
      }
    });

    const stats = await analyzer.analyzeDependencies(tempDir);
    expect(stats).toEqual({
      totalDependencies: 1,
      directDependencies: 1,
      devDependencies: 0,
      cjsDependencies: 0,
      esmDependencies: 0,
      installSize: 0,
      packageName: 'test-package',
      version: '1.0.0'
    });
  });
});
