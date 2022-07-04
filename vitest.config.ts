import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: resolve('test/vitest.setup.ts'),
  },
})
