import { execa } from 'execa'
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

import { pushEnvVars } from '../src'

describe('env', () => {
  test('should throw if no environments are provided', async () => {
    await expect(pushEnvVars('', [])).rejects.toThrowErrorMatchingInlineSnapshot('"No environments specified."')
  })

  test('should throw if an unknown environment is provided', async () => {
    await expect(pushEnvVars('', ['test'])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Unknown environment(s) specified."'
    )
  })

  test('should throw if multiple unknown environments are provided', async () => {
    await expect(pushEnvVars('', ['test', 'staging'])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Unknown environment(s) specified."'
    )
  })

  test('should throw if an unknown environment is provided with known environments', async () => {
    await expect(pushEnvVars('', ['production', 'test'])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Unknown environment(s) specified."'
    )
  })
})

describe('env var', () => {
  beforeAll(() => {
    vi.mock('execa', () => ({ execa: vi.fn() }))
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should push a basic variable to a single environment', async () => {
    const env = 'production'

    await pushEnvVars('test/fixtures/.env.basic', [env])

    const spy = vi.mocked(execa)

    expect(spy).toHaveBeenCalledTimes(2)

    expect(spy).toHaveBeenNthRemoveEnvCall(1, env, 'keyA')
    expect(spy).toHaveBeenNthAddEnvCall(2, env, 'keyA', 'valueA')
  })
})
