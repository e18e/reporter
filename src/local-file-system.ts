import type {FileSystem} from './file-system.js';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import {type Logger, pino} from 'pino';
import {fdir} from 'fdir';
import {readFile, stat} from 'node:fs/promises';

export class LocalFileSystem implements FileSystem {
  #root: string;
  #logger: Logger;

  constructor(root: string) {
    this.#root = root;
    this.#logger = pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    });
  }

  async getRootDir(): Promise<string> {
    return this.#root;
  }

  async listPackageFiles(): Promise<string[]> {
    const nodeModulesPath = path.join(this.#root, 'node_modules');

    try {
      await fs.access(nodeModulesPath);
      const crawler = new fdir()
        .withFullPaths()
        .withSymlinks()
        .filter((filePath) => filePath.endsWith('/package.json'))
        .crawl(nodeModulesPath);
      return await crawler.withPromise();
    } catch {
      return [];
    }
  }

  async readFile(path: string): Promise<string> {
    return await readFile(path, 'utf8');
  }

  async getInstallSize(): Promise<number> {
    const nodeModulesPath = path.join(this.#root, 'node_modules');

    let installSize = 0;

    try {
      await fs.access(nodeModulesPath);

      // TODO (43081j): we traverse the file system twice. Once here,
      // and once when finding the package.json files. It may be worth
      // caching some things one day so we only traverse once.
      const crawler = new fdir()
        .withFullPaths()
        .withSymlinks()
        .crawl(nodeModulesPath);
      const files = await crawler.withPromise();
      for (const filePath of files) {
        try {
          const stats = await stat(filePath);
          installSize += stats.size;
        } catch {
          this.#logger.debug('Error getting file stats for:', filePath);
        }
      }
    } catch {
      this.#logger.debug('No node_modules directory found');
    }

    return installSize;
  }
}
