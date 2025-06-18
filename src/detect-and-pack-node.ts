import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pack as packAsTarball} from '@publint/pack';
import type {Options} from './types.js';

export async function detectAndPack(
  root: string,
  pack: Exclude<Extract<Options['pack'], string>, 'none'>
) {
  let packageManager = pack;

  if (packageManager === 'auto') {
    const {detect} = await import('package-manager-detector/detect');
    let detected = (await detect({cwd: root}))?.name ?? 'npm';
    // Deno is not supported in `@publint/pack` (doesn't have a pack command)
    if (detected === 'deno') {
      detected = 'npm';
    }
    packageManager = detected;
  }

  const tarballPath = await packAsTarball(root, {
    packageManager,
    ignoreScripts: true,
    destination: await getTempPackDir()
  });

  try {
    return (await fs.readFile(tarballPath)).buffer as ArrayBuffer;
  } finally {
    await fs.unlink(tarballPath);
  }
}

async function getTempPackDir() {
  const tempDir = os.tmpdir() + path.sep;
  const tempPackDir = await fs.mkdtemp(tempDir + 'publint-pack-');
  return await fs.realpath(tempPackDir);
}
