import {publint} from 'publint';
import {
  checkPackage,
  createPackageFromTarballData,
  ResolutionKind
} from '@arethetypeswrong/core';
import {filterProblems, problemKindInfo} from '@arethetypeswrong/core/problems';
import type {Message, Options} from './types.js';
import {formatMessage} from 'publint/utils';
import {detectAndPack} from '#detect-and-pack';
import {groupProblemsByKind} from '@arethetypeswrong/core/utils';
import {analyzePackageModuleType} from './compute-type.js';
import type {PackageModuleType} from './compute-type.js';
import {
  analyzeDependencies,
  type DependencyStats
} from './analyze-dependencies.js';
import {LocalFileSystem} from './local-file-system.js';
import {TarballFileSystem} from './tarball-file-system.js';
import type {FileSystem} from './file-system.js';

export type {Message, Options, PackageModuleType};

export interface ReportResult {
  info: {
    name: string;
    version: string;
    type: PackageModuleType;
  };
  messages: Message[];
  dependencies: DependencyStats;
}

export async function report(options: Options) {
  const {root = process.cwd(), pack = 'auto'} = options ?? {};

  let fileSystem: FileSystem;
  const messages: Message[] = [];

  if (pack === 'none') {
    fileSystem = new LocalFileSystem(root);
  } else {
    let tarball: ArrayBuffer;

    if (typeof pack === 'object') {
      tarball = pack.tarball;
    } else {
      tarball = await detectAndPack(root, pack);
    }

    fileSystem = new TarballFileSystem(tarball);

    const attwResult = await runAttw(tarball);
    const publintResult = await runPublint(tarball);

    for (const message of attwResult) {
      messages.push(message);
    }

    for (const message of publintResult) {
      messages.push(message);
    }
  }

  const info = await computeInfo(fileSystem);
  const dependencies = await analyzeDependencies(fileSystem);

  return {info, messages, dependencies};
}

async function computeInfo(fileSystem: FileSystem) {
  const rootDir = await fileSystem.getRootDir();

  try {
    const pkgJson = await fileSystem.readFile(rootDir + '/package.json');
    const pkg = JSON.parse(pkgJson);
    return {
      name: pkg.name,
      version: pkg.version,
      type: analyzePackageModuleType(pkg)
    };
  } catch {
    throw new Error('No package.json found.');
  }
}

async function runAttw(tarball: ArrayBuffer) {
  const messages: Message[] = [];

  const pkg = createPackageFromTarballData(new Uint8Array(tarball));
  const result = await checkPackage(pkg);

  if (result.types === false) {
    messages.push({
      severity: 'suggestion',
      score: 0,
      message: `No type definitions found.`
    });
  } else {
    const subpaths = Object.keys(result.entrypoints);

    for (const subpath of subpaths) {
      const resolutions = result.entrypoints[subpath].resolutions;

      for (const resolutionKind in resolutions) {
        const problemsForMatrix = Object.entries(
          groupProblemsByKind(
            filterProblems(result, {
              resolutionKind: resolutionKind as ResolutionKind,
              entrypoint: subpath
            })
          )
        );
        for (const [_kind, problems] of problemsForMatrix) {
          for (const problem of problems) {
            messages.push({
              severity: 'error',
              score: 0,
              message:
                `"${subpath}" subpath: ` +
                problemKindInfo[problem.kind].description
            });
          }
        }
      }
    }
  }

  return messages;
}

async function runPublint(tarball: ArrayBuffer) {
  const messages: Message[] = [];

  const result = await publint({pack: {tarball}});
  for (const problem of result.messages) {
    messages.push({
      severity: problem.type,
      score: 0,
      message: formatMessage(problem, result.pkg) ?? ''
    });
  }

  return messages;
}
