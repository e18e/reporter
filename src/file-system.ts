export interface FileSystem {
  getRootDir(): Promise<string>;
  listPackageFiles(): Promise<string[]>;
  readFile(path: string): Promise<string>;
  getInstallSize(): Promise<number>;
}
