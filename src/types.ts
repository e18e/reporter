import type { Codemod, CodemodOptions } from 'module-replacements-codemods';

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
}

export interface DependencyAnalyzer {
  analyzeDependencies(root?: string): Promise<DependencyStats>;
}

export interface Replacement {
  from: string;
  to: string;
  condition?: (filename: string, source: string) => Promise<boolean>;
  factory: (options: CodemodOptions) => Codemod;
}
