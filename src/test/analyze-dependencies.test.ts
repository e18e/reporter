import {vi, describe, it, expect, beforeEach} from 'vitest';
import {analyzeDependencies} from '../analyze-dependencies.js';
import {createMockTarball} from './utils.js';

let mockUnpack: any;
vi.mock('@publint/pack', () => ({
  unpack: () => Promise.resolve(mockUnpack)
}));

describe('analyzeDependencies', () => {
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
    ]);

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
    ]);

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
    ]);

    await expect(analyzeDependencies(mockTarball)).rejects.toThrow(
      'No package.json found in the tarball.'
    );
  });
});
