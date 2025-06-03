export interface PackFile {
  name: string;
  data: string | ArrayBuffer | Uint8Array;
}

export type PackType =
  | 'auto'
  | 'npm'
  | 'yarn'
  | 'pnpm'
  | 'bun'
  | {tarball: ArrayBuffer};

export interface Options {
  root?: string;
  pack?: PackType;
}

export interface Message {
  severity: 'error' | 'warning' | 'suggestion';
  score: number;
  message: string;
}

export interface DuplicateDependency {
  name: string;
  versions: string[];
  locations: string[];
  suggestedFix?: {
    version: string;
    reason: string;
    breakingChanges?: boolean;
    peerDependencies?: Record<string, string>;
  };
  deduplicationImpact?: {
    sizeReduction: number;
    dependencyCountReduction: number;
  };
  deduplicationStrategies: {
    type: 'upgrade' | 'dedupe' | 'hoist' | 'resolver';
    description: string;
    command?: string;
    confidence: 'high' | 'medium' | 'low';
  }[];
  relatedDuplicates?: string[]; // Names of other packages that are duplicated together
}

export interface DependencyStats {
  totalDependencies: number;
  directDependencies: number;
  devDependencies: number;
  cjsDependencies: number;
  esmDependencies: number;
  installSize: number;
  tarballFiles?: string[];
  packageName?: string;
  version?: string;
  duplicateDependencies?: DuplicateDependency[];
}

export interface DependencyAnalyzer {
  analyzeDependencies(root?: string): Promise<DependencyStats>;
}
