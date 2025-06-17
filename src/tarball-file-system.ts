import {unpack, type UnpackResult} from '@publint/pack';
import type {FileSystem} from './file-system.js';

export class TarballFileSystem implements FileSystem {
  #tarball: ArrayBuffer;
  #unpackResult?: UnpackResult;

  constructor(tarball: ArrayBuffer) {
    this.#tarball = tarball;
  }

  async #getUnpackResult(): Promise<UnpackResult> {
    if (!this.#unpackResult) {
      this.#unpackResult = await unpack(this.#tarball);
    }
    return this.#unpackResult;
  }

  async getRootDir(): Promise<string> {
    const {rootDir} = await this.#getUnpackResult();
    return rootDir;
  }

  async listPackageFiles(): Promise<string[]> {
    const {files} = await this.#getUnpackResult();

    return files
      .filter((file) => file.name.endsWith('/package.json'))
      .map((file) => file.name);
  }

  async readFile(path: string): Promise<string> {
    const {files} = await this.#getUnpackResult();
    const file = files.find((f) => f.name === path);
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }
    return new TextDecoder().decode(file.data);
  }

  async getInstallSize(): Promise<number> {
    const {files} = await this.#getUnpackResult();
    return files.reduce((acc, file) => acc + file.data.byteLength, 0);
  }
}
