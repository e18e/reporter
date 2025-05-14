import { logger } from './logger.js';
import type { DependencyStats, DependencyAnalyzer } from './types.js';

/**
 * This file contains dependency analysis functionality.
 * 
 * To enable debug logging for dependency analysis:
 * ```typescript
 * import { logger } from './logger.js';
 * 
 * // Enable all debug logs
 * logger.setOptions({ enabled: true, level: 'debug' });
 * 
 * // Or create a specific logger for dependency analysis
 * const analyzerLogger = logger.child('analyzer');
 * analyzerLogger.setOptions({ enabled: true, level: 'debug' });
 * ```
 */

// Re-export types
export type { DependencyStats, DependencyAnalyzer };

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Import the appropriate implementation
let implementation: typeof import('./analyze-dependencies-node.js') | typeof import('./analyze-dependencies-browser.js');

if (isBrowser) {
  logger.debug('Using browser implementation');
  implementation = await import('./analyze-dependencies-browser.js');
} else {
  logger.debug('Using Node.js implementation');
  implementation = await import('./analyze-dependencies-node.js');
}

// Re-export everything from the chosen implementation
export const {
  LocalDependencyAnalyzer,
  RemoteDependencyAnalyzer,
  analyzeDependencies
} = implementation;
