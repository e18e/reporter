export const meta = {
  name: 'migrate',
  description: 'Migrate from a package to a more performant alternative.',
  args: {
    'dry-run': {
      type: 'boolean',
      default: false,
      description: `Don't apply any fixes, only show what would change.`
    },
    interactive: {
      type: 'boolean',
      default: false,
      description: 'Run in interactive mode.'
    },
    include: {
      type: 'string',
      default: '**/*.{ts,js}',
      description: 'Files to migrate'
    }
  }
} as const;
