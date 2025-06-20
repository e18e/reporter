import type {DependencyNode, DuplicateDependency, PackageJsonLike} from './types.js';
import type {FileSystem} from './file-system.js';
import {pino} from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

export class DependencyTreeBuilder {
  private fileSystem: FileSystem;
  private visitedPackages = new Set<string>();
  private dependencyNodes: DependencyNode[] = [];

  constructor(fileSystem: FileSystem) {
    this.fileSystem = fileSystem;
  }

  /**
   * Builds a complete dependency tree by recursively analyzing all package.json files
   */
  async buildDependencyTree(): Promise<DependencyNode[]> {
    const packageFiles = await this.fileSystem.listPackageFiles();
    const rootDir = await this.fileSystem.getRootDir();

    logger.debug(`Found ${packageFiles.length} package.json files`);

    // Start with the root package
    const rootPackagePath = rootDir + '/package.json';
    const rootPackage = await this.parsePackageJson(rootPackagePath);
    
    if (!rootPackage) {
      logger.warn('Could not parse root package.json');
      return [];
    }

    // Add root package to the tree
    this.dependencyNodes.push({
      name: rootPackage.name,
      version: rootPackage.version,
      path: 'root',
      depth: 0,
      packagePath: rootPackagePath
    });

    // Process all dependencies recursively
    await this.processDependencies(rootPackage, 'root', 1);

    logger.debug(`Built dependency tree with ${this.dependencyNodes.length} nodes`);
    return this.dependencyNodes;
  }

  /**
   * Processes dependencies recursively, building the dependency tree
   */
  private async processDependencies(
    packageJson: PackageJsonLike,
    parentPath: string,
    depth: number
  ): Promise<void> {
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    for (const [depName, depVersion] of Object.entries(allDependencies)) {
      const depPath = `${parentPath} > ${depName}`;
      const packagePath = await this.findPackageJson(depName);

      if (!packagePath) {
        logger.debug(`Could not find package.json for ${depName}`);
        continue;
      }

      // Check if we've already processed this package at this path
      const visitedKey = `${packagePath}:${depPath}`;
      if (this.visitedPackages.has(visitedKey)) {
        logger.debug(`Already processed ${depName} at path ${depPath}`);
        continue;
      }
      this.visitedPackages.add(visitedKey);

      const depPackage = await this.parsePackageJson(packagePath);
      if (!depPackage) {
        logger.debug(`Could not parse package.json for ${depName}`);
        continue;
      }

      // Add dependency to the tree
      this.dependencyNodes.push({
        name: depName,
        version: depVersion,
        path: depPath,
        parent: packageJson.name,
        depth,
        packagePath
      });

      // Recursively process this dependency's dependencies
      await this.processDependencies(depPackage, depPath, depth + 1);
    }
  }

  /**
   * Finds the package.json file for a given dependency
   */
  private async findPackageJson(depName: string): Promise<string | null> {
    const packageFiles = await this.fileSystem.listPackageFiles();
    
    // Look for exact match first
    const exactMatch = packageFiles.find(file => 
      file.includes(`/node_modules/${depName}/package.json`)
    );
    
    if (exactMatch) {
      return exactMatch;
    }

    // Look for scoped packages
    const scopedMatch = packageFiles.find(file => 
      file.includes(`/node_modules/@${depName.split('/')[0]}/${depName.split('/')[1]}/package.json`)
    );

    return scopedMatch || null;
  }

  /**
   * Parses a package.json file
   */
  private async parsePackageJson(packagePath: string): Promise<PackageJsonLike | null> {
    try {
      const content = await this.fileSystem.readFile(packagePath);
      return JSON.parse(content) as PackageJsonLike;
    } catch (error) {
      logger.debug(`Failed to parse ${packagePath}: ${error}`);
      return null;
    }
  }
}

export const DuplicateDetector = {
  /**
   * Detects duplicate dependencies in the dependency tree
   */
  detectDuplicates(dependencyNodes: DependencyNode[]): DuplicateDependency[] {
    const duplicates: DuplicateDependency[] = [];
    const packageGroups = new Map<string, DependencyNode[]>();

    // Group dependencies by name
    for (const node of dependencyNodes) {
      if (!packageGroups.has(node.name)) {
        packageGroups.set(node.name, []);
      }
      packageGroups.get(node.name)?.push(node);
    }

    // Find packages with multiple versions
    for (const [packageName, nodes] of packageGroups) {
      if (nodes.length > 1) {
        const duplicate = this.analyzeDuplicate(packageName, nodes);
        if (duplicate) {
          duplicates.push(duplicate);
        }
      }
    }

    return duplicates;
  },

  /**
   * Analyzes a group of nodes for the same package to determine duplicate type
   */
  analyzeDuplicate(
    packageName: string,
    nodes: DependencyNode[]
  ): DuplicateDependency | null {
    // Skip root package
    if (packageName === 'root' || nodes.some(n => n.name === 'root')) {
      return null;
    }

    const uniqueVersions = new Set(nodes.map(n => n.version));
    
    let severity: 'exact' | 'conflict' | 'resolvable';
    
    if (uniqueVersions.size === 1) {
      severity = 'exact';
    } else {
      // For now, treat all version differences as conflicts
      // TODO: Implement semantic version compatibility checking
      severity = 'conflict';
    }

    return {
      name: packageName,
      versions: nodes,
      severity,
      potentialSavings: this.calculatePotentialSavings(nodes),
      suggestions: this.generateSuggestions(nodes)
    };
  },

  /**
   * Calculates potential savings from deduplication
   */
  calculatePotentialSavings(nodes: DependencyNode[]): number {
    // For now, return a simple estimate based on number of duplicates
    // TODO: Implement actual size calculation
    return nodes.length - 1;
  },

  /**
   * Generates suggestions for resolving duplicates
   */
  generateSuggestions(
    nodes: DependencyNode[]
  ): string[] {
    const suggestions: string[] = [];
    
    // Group by version to identify the most common version
    const versionCounts = new Map<string, number>();
    for (const node of nodes) {
      versionCounts.set(node.version, (versionCounts.get(node.version) || 0) + 1);
    }

    const mostCommonVersion = Array.from(versionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (mostCommonVersion && mostCommonVersion[1] > 1) {
      suggestions.push(
        `Consider standardizing on version ${mostCommonVersion[0]} (used by ${mostCommonVersion[1]} dependencies)`
      );
    }

    // Suggest checking for newer versions of consuming packages
    const uniqueParents = new Set(nodes.map(n => n.parent).filter(Boolean));
    if (uniqueParents.size > 1) {
      suggestions.push(
        `Check if newer versions of consuming packages (${Array.from(uniqueParents).join(', ')}) would resolve this duplicate`
      );
    }

    return suggestions;
  }
}; 