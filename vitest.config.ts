import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
  ],
  test: {
    reporters: 'dot',
    include: [
      'packages/**/*.test.ts',
      'src/**/*.test.ts',
      'test/**/*.test.ts'
    ]
  }
})
