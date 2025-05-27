import {describe, it, expect} from 'vitest';
import {analyzeDependencies} from '../analyze-dependencies.js';
import fs from 'node:fs/promises';
import path from 'node:path';

// Integration test using a real tarball fixture

describe('analyzeDependencies (integration)', () => {
  it('should analyze a real tarball fixture', async () => {
    const tarballPath = path.join(__dirname, 'fixtures', 'test-package.tgz');
    const tarballBuffer = await fs.readFile(tarballPath);
    const result = await analyzeDependencies(tarballBuffer.buffer);
    expect(result).toMatchObject({
      totalDependencies: expect.any(Number),
      directDependencies: expect.any(Number),
      devDependencies: expect.any(Number),
      cjsDependencies: expect.any(Number),
      esmDependencies: expect.any(Number),
      installSize: expect.any(Number),
      packageName: 'test-package',
      version: '1.0.0'
    });
  });
});
