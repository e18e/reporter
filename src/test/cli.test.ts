import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {runCli} from '../cli.js';

// Mock the browser environment
vi.mock('../analyze-dependencies-browser.js', () => ({
  LocalDependencyAnalyzer: class MockLocalAnalyzer {
    async analyzeDependencies() {
      throw new Error('Local dependency analysis is not supported in the browser');
    }
  },
  RemoteDependencyAnalyzer: class MockRemoteAnalyzer {
    async analyzeDependencies() {
      throw new Error('Remote dependency analysis is not supported in the browser');
    }
  },
  analyzeDependencies: async () => {
    throw new Error('Local dependency analysis is not supported in the browser');
  }
}));

describe('CLI in browser environment', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Mock browser environment
    (global as any).window = { document: {} };
  });

  afterEach(() => {
    // Restore window object
    (global as any).window = originalWindow;
  });

  it('should throw an error when run in a browser environment', async () => {
    await expect(runCli(['--pack', 'npm'])).rejects.toThrow(
      'Local dependency analysis is not supported in the browser'
    );
  });
}); 