import assert from 'node:assert'

import { type EnhancedSpy, expect } from 'vitest'

expect.extend({
  toHaveBeenNthAddEnvCall(received: EnhancedSpy, ...args: (number | string)[]) {
    const [times, env, key, value] = args

    assert(typeof times === 'number')
    assert(typeof env === 'string')
    assert(typeof key === 'string')
    assert(typeof value === 'string')

    const spyName = received.getMockName()
    const nthCall = received.mock.calls[times - 1]

    const expected = ['printf', [`"${value}"`, '|', 'npx', '--yes', 'vercel', 'env', 'add', key, env], { shell: true }]

    return {
      pass: this.equals(nthCall, expected),
      message: () =>
        `expected call #${times} of ${spyName} to ${
          this.isNot ? 'not ' : ''
        }add the environment variable '${key}' to '${env}'.

${this.utils.diff(nthCall, expected)}`,
    }
  },
  toHaveBeenNthRemoveEnvCall(received: EnhancedSpy, ...args: (number | string)[]) {
    const [times, env, key] = args

    assert(typeof times === 'number')
    assert(typeof env === 'string')
    assert(typeof key === 'string')

    const spyName = received.getMockName()
    const nthCall = received.mock.calls[times - 1]

    const expected = ['npx', ['--yes', 'vercel', 'env', 'rm', key, env, '-y'], { shell: true }]

    return {
      pass: this.equals(nthCall, expected),
      message: () =>
        `expected call #${times} of ${spyName} to ${
          this.isNot ? 'not ' : ''
        }remove the environment variable '${key}' to '${env}'.

${this.utils.diff(nthCall, expected)}`,
    }
  },
})
