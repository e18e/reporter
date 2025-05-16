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
import {unpack} from '@publint/pack';
import {analyzePackageModuleType} from './compute-type.js';
import type {PackageModuleType} from './compute-type.js';
import {
  analyzeDependencies,
  type DependencyStats
} from './analyze-dependencies.js';

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

  let tarball: ArrayBuffer;
  if (typeof pack === 'object') {
    tarball = pack.tarball;
  } else {
    tarball = await detectAndPack(root, pack);
  }

  const info = await computeInfo(tarball);
  const dependencies = await analyzeDependencies(tarball);
  const attwResult = await runAttw(tarball);
  const publintResult = await runPublint(tarball);

  const messages = [...attwResult, ...publintResult];

  return {info, messages, dependencies};
}

async function computeInfo(tarball: ArrayBuffer) {
  const {files, rootDir} = await unpack(tarball);
  const decoder = new TextDecoder();
  const pkgJson = files.find((f) => f.name === rootDir + '/package.json');
  if (pkgJson === undefined) {
    throw new Error('No package.json found in the tarball.');
  }

  const pkg = JSON.parse(decoder.decode(pkgJson.data));
  return {
    name: pkg.name,
    version: pkg.version,
    type: analyzePackageModuleType(pkg)
  };
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
