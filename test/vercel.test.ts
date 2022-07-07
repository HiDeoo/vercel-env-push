import { afterAll, afterEach, beforeAll, describe, expect, type SpyInstance, test, vi } from 'vitest'

import { pushEnvVars } from '../src'
import * as utils from '../src/utils'

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
  let execSpy: SpyInstance<Parameters<typeof utils.exec>, ReturnType<typeof utils.exec>>

  beforeAll(() => {
    execSpy = vi.spyOn(utils, 'exec').mockImplementation(vi.fn<[string]>())
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

    const envVars = {
      keyA: 'valueA',
      keyAExpanded: 'valueA',
      keyB: 'valueB',
    }

    const expectedCommands: string[][] = []

    for (const [envKey, envValue] of Object.entries(envVars)) {
      for (const env of envs) {
        expectedCommands.push(
          [`npx --yes vercel env rm ${envKey} ${env} -y`],
          [`printf "${envValue}" | npx --yes vercel env add ${envKey} ${env}`]
        )
      }
    }

    expect(execSpy.mock.calls.length).toBe(expectedCommands.length)

    for (const expectedCommand of expectedCommands) {
      expect(execSpy.mock.calls).toContainEqual(expectedCommand)
    }
  })

  test('should not push environment variables with the dry option', async () => {
    await pushEnvVars('test/fixtures/.env.test', ['production'], { dryRun: true })

    expect(execSpy).not.toHaveBeenCalled()
  })
})
