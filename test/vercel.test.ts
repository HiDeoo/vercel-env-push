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

  test.each([
    [1, ['production']],
    [2, ['preview', 'production']],
    [3, ['development', 'preview', 'production']],
  ])('should push environment variables to %i environment(s)', async (_count, envs) => {
    await pushEnvVars('test/fixtures/.env.test', envs)

    const expected = [
      ['keyA', 'valueA'],
      ['keyAExpanded', 'valueA'],
      ['keyB', 'valueB'],
    ] as const

    const execaSpy = vi.mocked(execa)

    // The call count starts at 1.
    let index = 1

    for (const [key, value] of expected) {
      for (const env of envs) {
        expect(execaSpy).toHaveBeenNthRemoveEnvCall(index++, env, key)
        expect(execaSpy).toHaveBeenNthAddEnvCall(index++, env, key, value)
      }
    }
  })

  test('should not push environment variables with the dry option', async () => {
    await pushEnvVars('test/fixtures/.env.test', ['production'], { dryRun: true })

    const execaSpy = vi.mocked(execa)

    expect(execaSpy).not.toHaveBeenCalled()
  })
})
