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
  | 'none'
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
  packageName?: string;
  version?: string;
}

export interface DependencyAnalyzer {
  analyzeDependencies(root?: string): Promise<DependencyStats>;
}

export interface PackageJsonLike {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}
