import {writeFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {all} from 'module-replacements';
import {codemods} from 'module-replacements-codemods';
import {fixableReplacements} from '../commands/fixable-replacements.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function generateFixableReplacements() {
  const existingReplacements = new Map(
    fixableReplacements.map((r) => [r.from, r])
  );

  let newCode = `import type { Replacement } from '../types.js';\n`;
  newCode += `import { codemods } from 'module-replacements-codemods';\n\n`;
  newCode += `export const fixableReplacements: Replacement[] = [\n`;

  let count = 0;
  for (const replacement of all.moduleReplacements) {
    if (replacement.moduleName in codemods) {
      const existing = existingReplacements.get(replacement.moduleName);
      const to = existing?.to ?? 'TODO';

      newCode += `  {\n`;
      newCode += `    from: "${replacement.moduleName}",\n`;
      newCode += `    to: "${to}",\n`;
      newCode += `    factory: codemods["${replacement.moduleName}"]\n`;
      newCode += `  },\n`;
      count++;
    }
  }

  newCode += `];\n`;

  const outputPath = join(
    __dirname,
    '..',
    'commands',
    'fixable-replacements.ts'
  );
  await writeFile(outputPath, newCode);
  
  console.log(`✅ Generated fixable-replacements.ts with ${count} replacements`);
  console.log(`📁 Output: ${outputPath}`);
}

generateFixableReplacements().catch((error) => {
  console.error('Failed to generate fixable replacements:', error);
  process.exit(1);
});
