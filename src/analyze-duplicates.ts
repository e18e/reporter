import semver from 'semver';
import type { DuplicateDependency } from './types.js';
import { getPackageInfo, findLatestCompatibleVersion, calculateDeduplicationImpact } from './npm-registry.js';

interface PackageVersion {
  version: string;
  location: string;
}

export async function analyzeDuplicateDependencies(
  packageVersions: Map<string, Set<PackageVersion>>
): Promise<DuplicateDependency[]> {
  const duplicateDependencies: DuplicateDependency[] = [];

  for (const [name, versions] of packageVersions) {
    if (versions.size > 1) {
      const versionInfo = Array.from(versions);
      const packageInfo = await getPackageInfo(name);
      
      if (packageInfo) {
        const latestVersion = versionInfo.reduce((latest, current) => {
          return semver.gt(current.version, latest.version) ? current : latest;
        }, versionInfo[0]);

        const duplicate: DuplicateDependency = {
          name,
          versions: versionInfo.map(v => v.version),
          locations: versionInfo.map(v => v.location),
          deduplicationStrategies: []
        };

        // Check for newer versions
        const latestCompatible = findLatestCompatibleVersion(
          latestVersion.version,
          packageInfo,
          packageInfo.versions[latestVersion.version]?.peerDependencies
        );

        if (latestCompatible) {
          duplicate.suggestedFix = {
            version: latestCompatible.version,
            reason: `Upgrading to version ${latestCompatible.version} would resolve duplicate dependencies`,
            breakingChanges: latestCompatible.hasBreakingChanges,
            peerDependencies: packageInfo.versions[latestCompatible.version]?.peerDependencies
          };

          duplicate.deduplicationStrategies.push({
            type: 'upgrade',
            description: `Upgrade to version ${latestCompatible.version}`,
            command: `npm install ${name}@${latestCompatible.version}`,
            confidence: latestCompatible.hasBreakingChanges ? 'medium' : 'high'
          });
        }

        // Add dedupe strategy
        duplicate.deduplicationStrategies.push({
          type: 'dedupe',
          description: 'Use npm dedupe to remove duplicate dependencies',
          command: 'npm dedupe',
          confidence: 'high'
        });

        // Add hoisting strategy if applicable
        if (versionInfo.some(v => v.location.includes('node_modules'))) {
          duplicate.deduplicationStrategies.push({
            type: 'hoist',
            description: 'Hoist common dependencies to the root node_modules',
            confidence: 'medium'
          });
        }

        // Calculate deduplication impact
        duplicate.deduplicationImpact = calculateDeduplicationImpact(
          versionInfo.map(v => v.version),
          packageInfo
        );

        // Find related duplicates
        const relatedDeps = new Set<string>();
        for (const version of versionInfo) {
          const deps = packageInfo.versions[version.version]?.dependencies || {};
          for (const dep of Object.keys(deps)) {
            const depVersions = packageVersions.get(dep);
            if (depVersions && depVersions.size > 1) {
              relatedDeps.add(dep);
            }
          }
        }
        if (relatedDeps.size > 0) {
          duplicate.relatedDuplicates = Array.from(relatedDeps);
        }

        duplicateDependencies.push(duplicate);
      }
    }
  }

  return duplicateDependencies;
} 