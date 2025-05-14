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

// Logger Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type ColorHex = `#${string}`;

export interface LoggerOptions {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
}

export interface LoggerColors {
  debug: ColorHex;
  info: ColorHex;
  warn: ColorHex;
  error: ColorHex;
  reset: ColorHex;
}

export type LogArgs = unknown[];

export interface FormattedLogParts {
  timestamp?: string;
  prefix?: string;
  level: string;
  colorStyle?: string;
  args: LogArgs;
}

export interface DependencyStats {
  totalDependencies: number;
  directDependencies: number;
  devDependencies: number;
  cjsDependencies: number;
  esmDependencies: number;
  installSize: number;
  tarballFiles?: string[];
}

export interface DependencyAnalyzer {
  analyzeDependencies(root?: string): Promise<DependencyStats>;
}
