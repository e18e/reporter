import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {spawn} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import {createTempDir, cleanupTempDir, createTestPackage} from './utils.js';

let mockTarballPath: string;
let tempDir: string;

beforeAll(async () => {
  // Create a temporary directory for the test package
  tempDir = await createTempDir();

  // Create a test package with some files
  await createTestPackage(tempDir, {
    name: 'mock-package',
    version: '1.0.0',
    type: 'module',
    main: 'index.js',
    dependencies: {
      'some-dep': '1.0.0'
    }
  });

  // Create a simple index.js file
  await fs.writeFile(path.join(tempDir, 'index.js'), 'console.log("Hello, world!");');

  // Create node_modules with a dependency
  const nodeModules = path.join(tempDir, 'node_modules');
  await fs.mkdir(nodeModules, {recursive: true});
  await fs.mkdir(path.join(nodeModules, 'some-dep'), {recursive: true});
  await fs.writeFile(
    path.join(nodeModules, 'some-dep', 'package.json'),
    JSON.stringify({
      name: 'some-dep',
      version: '1.0.0',
      type: 'module'
    })
  );

  // Run npm pack to create a tarball
  const {stdout} = await new Promise<{stdout: string}>((resolve, reject) => {
    const proc = spawn('npm', ['pack'], {cwd: tempDir});
    let stdout = '';
    proc.stdout.on('data', (data) => (stdout += data.toString()));
    proc.on('close', (code) => {
      if (code === 0) resolve({stdout});
      else reject(new Error(`npm pack failed with code ${code}`));
    });
  });

  // The tarball is created in the current directory, so move it to our temp dir
  const tarballName = stdout.trim();
  mockTarballPath = path.join(tempDir, tarballName);
  await fs.rename(path.join(tempDir, tarballName), mockTarballPath);
});

afterAll(async () => {
  await cleanupTempDir(tempDir);
});

function runCliProcess(args: string[], cwd?: string): Promise<{stdout: string; stderr: string; code: number | null}> {
  return new Promise((resolve) => {
    const cliPath = path.resolve(__dirname, '../../lib/cli.js');
    const proc = spawn('node', [cliPath, ...args], {env: process.env, cwd: cwd || process.cwd()});
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => (stdout += data.toString()));
    proc.stderr.on('data', (data) => (stderr += data.toString()));
    proc.on('close', (code) => resolve({stdout, stderr, code}));
  });
}

describe('CLI', () => {
  it('should run successfully with default options', async () => {
    const {stdout, stderr, code} = await runCliProcess([mockTarballPath], tempDir);
    if (code !== 0) {
      console.error('CLI Error:', stderr);
    }
    expect(code).toBe(0);
    // No local analysis for tarball input
    // expect(stdout).toContain('Local Analysis');
    expect(stdout).toContain('Tarball Analysis');
  });

  it('should show tarball files when --log-level=debug is used', async () => {
    const {stdout, stderr, code} = await runCliProcess([mockTarballPath, '--log-level=debug'], tempDir);
    if (code !== 0) {
      console.error('CLI Error:', stderr);
    }
    expect(code).toBe(0);
    expect(stdout).toContain('Files in tarball:');
  });

  it('should display package report', async () => {
    const {stdout, stderr, code} = await runCliProcess([mockTarballPath], tempDir);
    expect(code).toBe(0);
    expect(stdout).toMatchSnapshot();
    expect(stderr).toMatchSnapshot();
  });
}); 