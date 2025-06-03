import { pino } from 'pino';
import semver from 'semver';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

interface NpmPackageInfo {
  versions: Record<string, {
    version: string;
    peerDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  }>;
}

export async function getPackageInfo(packageName: string): Promise<NpmPackageInfo | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      logger.warn(`Failed to fetch package info for ${packageName}: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error fetching package info for ${packageName}:`, error);
    return null;
  }
}

export function findLatestCompatibleVersion(
  currentVersion: string,
  packageInfo: NpmPackageInfo,
  peerDependencies?: Record<string, string>
): { version: string; hasBreakingChanges: boolean } | null {
  const currentSemver = semver.parse(currentVersion);
  if (!currentSemver) {
    logger.warn(`Invalid version format for ${currentVersion}`);
    return null;
  }

  const availableVersions = Object.keys(packageInfo.versions)
    .map(v => semver.parse(v))
    .filter((v): v is semver.SemVer => v !== null)
    .sort((a, b) => b.compare(a));

  // Find the latest version that satisfies peer dependencies
  for (const version of availableVersions) {
    if (version.major === currentSemver.major) {
      // Same major version, no breaking changes
      return { version: version.version, hasBreakingChanges: false };
    }

    // Check if this version satisfies peer dependencies
    const versionInfo = packageInfo.versions[version.version];
    if (peerDependencies && versionInfo.peerDependencies) {
      const satisfiesPeerDeps = Object.entries(peerDependencies).every(
        ([dep, range]) => {
          const peerRange = versionInfo.peerDependencies?.[dep];
          return !peerRange || semver.satisfies(range, peerRange);
        }
      );
      if (satisfiesPeerDeps) {
        return { version: version.version, hasBreakingChanges: true };
      }
    }
  }

  return null;
}

export function calculateDeduplicationImpact(
  versions: string[],
  packageInfo: NpmPackageInfo
): { sizeReduction: number; dependencyCountReduction: number } {
  const totalSize = 0;
  let totalDeps = 0;
  const uniqueDeps = new Set<string>();

  // Calculate current size and dependencies
  for (const version of versions) {
    const versionInfo = packageInfo.versions[version];
    if (versionInfo) {
      // Add direct dependencies
      if (versionInfo.dependencies) {
        Object.keys(versionInfo.dependencies).forEach(dep => uniqueDeps.add(dep));
        totalDeps += Object.keys(versionInfo.dependencies).length;
      }
      // Add peer dependencies
      if (versionInfo.peerDependencies) {
        Object.keys(versionInfo.peerDependencies).forEach(dep => uniqueDeps.add(dep));
        totalDeps += Object.keys(versionInfo.peerDependencies).length;
      }
    }
  }

  return {
    sizeReduction: totalSize,
    dependencyCountReduction: totalDeps - uniqueDeps.size
  };
} 