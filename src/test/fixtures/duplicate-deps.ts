import type {DependencyStats, DuplicateDependency} from '../../types.js';

export const mockDuplicateDeps: DuplicateDependency[] = [
  {
    name: 'test-package',
    versions: ['1.0.0', '2.0.0'],
    locations: ['/path/to/package1', '/path/to/package2'],
    suggestedFix: {
      version: '2.0.0',
      reason: 'Upgrading to version 2.0.0 would resolve duplicate dependencies'
    }
  }
];

export const mockStatsWithDuplicates: DependencyStats = {
  totalDependencies: 2,
  directDependencies: 1,
  devDependencies: 1,
  cjsDependencies: 1,
  esmDependencies: 1,
  installSize: 1000,
  packageName: 'test-package',
  version: '1.0.0',
  duplicateDependencies: mockDuplicateDeps
};

export const mockStatsWithoutDuplicates: DependencyStats = {
  totalDependencies: 2,
  directDependencies: 1,
  devDependencies: 1,
  cjsDependencies: 1,
  esmDependencies: 1,
  installSize: 1000,
  packageName: 'test-package',
  version: '1.0.0',
  duplicateDependencies: []
}; 