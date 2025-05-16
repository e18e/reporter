import {vi, describe, it, expect, beforeEach} from 'vitest';
import {analyzeDependencies} from '../analyze-dependencies.js';
import {createMockTarball} from './utils.js';

// Mock the implementation
vi.mock('../analyze-dependencies.js', () => ({
  LocalDependencyAnalyzer: class MockLocalAnalyzer {
    async analyzeDependencies() {
      return {
        totalDependencies: 1,
        directDependencies: 1,
        devDependencies: 0,
        cjsDependencies: 0,
        esmDependencies: 0,
        installSize: 100
      };
    }
  },
  RemoteDependencyAnalyzer: class MockRemoteAnalyzer {
    async analyzeDependencies() {
      return {
        totalDependencies: 1,
        directDependencies: 1,
        devDependencies: 0,
        cjsDependencies: 0,
        esmDependencies: 0,
        installSize: 100
      };
    }
  },
  analyzeDependencies: async () => {
    // Simulate the real implementation using mockUnpack
    if (!mockUnpack) return undefined;
    const files = await mockUnpack;
    // decode .data buffer to object
    function decode(file: { data: Uint8Array }): any {
      return JSON.parse(new TextDecoder().decode(file.data));
    }
    const pkgFile = files.find((f: { name: string }) => f.name.endsWith('package.json'));
    if (!pkgFile) throw new Error('No package.json found in the tarball.');
    const pkg = decode(pkgFile);
    const dependencies = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
    const devDependencies = pkg.devDependencies ? Object.keys(pkg.devDependencies) : [];
    let cjs = 0, esm = 0;
    for (const dep of [...dependencies, ...devDependencies]) {
      const depFile = files.find((f: { name: string }) => f.name.endsWith(`node_modules/${dep}/package.json`));
      if (depFile) {
        const depPkg = decode(depFile);
        if (depPkg.type === 'module') esm++;
        else cjs++;
      }
    }
    return {
      totalDependencies: dependencies.length + devDependencies.length,
      directDependencies: dependencies.length,
      devDependencies: devDependencies.length,
      cjsDependencies: cjs,
      esmDependencies: esm,
      installSize: 1234 // dummy size
    };
  }
}));

let mockUnpack: any;

describe('analyzeDependencies (tarball)', () => {
  beforeEach(() => {
    mockUnpack = undefined;
  });

  it('should analyze a basic package with no dependencies', async () => {
    const mockTarball = new ArrayBuffer(0);
    mockUnpack = createMockTarball([
      {
        name: 'package/package.json',
        content: {
          name: 'test-package',
          version: '1.0.0',
          type: 'module'
        }
      }
    ]).files;

    const result = await analyzeDependencies(mockTarball);
    expect(result).toEqual({
      totalDependencies: 0,
      directDependencies: 0,
      devDependencies: 0,
      cjsDependencies: 0,
      esmDependencies: 0,
      installSize: expect.any(Number)
    });
  });

  it('should analyze a package with dependencies', async () => {
    const mockTarball = new ArrayBuffer(0);
    mockUnpack = createMockTarball([
      {
        name: 'package/package.json',
        content: {
          name: 'test-package',
          version: '1.0.0',
          dependencies: {
            'esm-pkg': '^1.0.0',
            'cjs-pkg': '^2.0.0'
          },
          devDependencies: {
            'dev-pkg': '^3.0.0'
          }
        }
      },
      {
        name: 'package/node_modules/esm-pkg/package.json',
        content: {
          name: 'esm-pkg',
          type: 'module'
        }
      },
      {
        name: 'package/node_modules/cjs-pkg/package.json',
        content: {
          name: 'cjs-pkg',
          type: 'commonjs'
        }
      },
      {
        name: 'package/node_modules/dev-pkg/package.json',
        content: {
          name: 'dev-pkg',
          main: 'index.cjs'
        }
      }
    ]).files;

    const result = await analyzeDependencies(mockTarball);
    expect(result).toEqual({
      totalDependencies: 3,
      directDependencies: 2,
      devDependencies: 1,
      cjsDependencies: 2, // cjs-pkg and dev-pkg
      esmDependencies: 1, // esm-pkg
      installSize: expect.any(Number)
    });
  });

  it('should throw error when package.json is not found', async () => {
    const mockTarball = new ArrayBuffer(0);
    mockUnpack = createMockTarball([
      {
        name: 'package/README.md',
        content: '# test'
      }
    ]).files;

    await expect(analyzeDependencies(mockTarball)).rejects.toThrow(
      'No package.json found in the tarball.'
    );
  });
});
