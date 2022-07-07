import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import wyt from 'wyt'

import { pushEnvVars } from '../src'
import * as process from '../src/libs/process'

import { type Spy } from './libs/vitest'

describe('env', () => {
  test('should throw if no environments are provided', async () => {
    await expect(pushEnvVars('', [])).rejects.toThrowErrorMatchingInlineSnapshot('"No environments specified."')
  })

  test('should throw if an unknown environment is provided', async () => {
    await expect(pushEnvVars('', ['test'])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Unknown environment \'test\' specified."'
    )
  })

  test('should throw if multiple unknown environments are provided', async () => {
    await expect(pushEnvVars('', ['test', 'staging'])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Unknown environment \'test\' specified."'
    )
  })

  test('should throw if an unknown environment is provided with known environments', async () => {
    await expect(pushEnvVars('', ['production', 'test'])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Unknown environment \'test\' specified."'
    )
  })
})

describe('env var', () => {
  let execSpy: Spy<typeof process.exec>

  beforeAll(() => {
    vi.mock('wyt')

    execSpy = vi.spyOn(process, 'exec').mockImplementation(vi.fn<[string]>())
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    execSpy.mockClear()

    const rateLimiterMock = vi.mocked(vi.mocked(wyt).mock.results[0]?.value)
    rateLimiterMock.mockClear()
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

  test('should not try to add environment variables if removing them failed for an unknown reason', async () => {
    execSpy.mockResolvedValueOnce({ stderr: '', stdout: '' }).mockRejectedValueOnce(new Error('test'))

    await expect(pushEnvVars('test/fixtures/.env.test', ['production'])).rejects.toThrowErrorMatchingInlineSnapshot(
      "\"Unable to remove environment variable 'keyAExpanded' from 'production'.\""
    )

    expect(execSpy).toHaveBeenCalledTimes(3)
  })

  test('should ignore errors related to deleting an unknown environment variables', async () => {
    class ExecError extends Error {
      constructor(public stderr: string) {
        super()
      }
    }

    const error = new ExecError('test')
    error.stderr = 'Environment Variable was not found'

    execSpy.mockResolvedValueOnce({ stderr: '', stdout: '' }).mockRejectedValueOnce(error)

    await pushEnvVars('test/fixtures/.env.test', ['production'])

    expect(execSpy).toHaveBeenCalledTimes(6)
  })

  test('should throw the first encountered error during a push', async () => {
    const execResponse = { stderr: '', stdout: '' }

    execSpy
      .mockResolvedValueOnce(execResponse)
      .mockResolvedValueOnce(execResponse)
      .mockResolvedValueOnce(execResponse)
      .mockResolvedValueOnce(execResponse)
      .mockRejectedValueOnce(new Error('test'))

    await expect(pushEnvVars('test/fixtures/.env.test', ['production'])).rejects.toThrowErrorMatchingInlineSnapshot(
      "\"Unable to add environment variable 'keyAExpanded' to 'production'.\""
    )

    expect(execSpy).toHaveBeenCalledTimes(6)
  })

  test('should rate limit requests', async () => {
    await pushEnvVars('test/fixtures/.env.test', ['production'])

    const rateLimiterMock = vi.mocked(vi.mocked(wyt).mock.results[0]?.value)

    expect(rateLimiterMock).toHaveBeenCalledTimes(6)
  })
})
