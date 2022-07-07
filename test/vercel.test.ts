import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import wyt from 'wyt'

import { pushEnvVars } from '../src'
import { type EnvVars } from '../src/libs/file'
import * as process from '../src/libs/process'

import { type Spy } from './libs/vitest'

const defaultExpectedEnvVars = {
  keyA: 'valueA',
  keyAExpanded: 'valueA',
  keyB: 'valueB',
}

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

    const expectedCommands = getExpectedCommands(envs, defaultExpectedEnvVars)

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

  describe('prePush', () => {
    test('should modify environment variable names and values', async () => {
      const envs = ['development', 'production']

      await pushEnvVars('test/fixtures/.env.test', envs, {
        prePush: (envVars) => {
          const newEnvVars: EnvVars = {}

          for (const [key, value] of Object.entries(envVars)) {
            newEnvVars[`modified_${key}`] = `modified_${value}`
          }

          return newEnvVars
        },
      })

      const expectedCommands = getExpectedCommands(envs, {
        modified_keyA: 'modified_valueA',
        modified_keyAExpanded: 'modified_valueA',
        modified_keyB: 'modified_valueB',
      })

      expect(execSpy.mock.calls.length).toBe(expectedCommands.length)

      for (const expectedCommand of expectedCommands) {
        expect(execSpy.mock.calls).toContainEqual(expectedCommand)
      }
    })

    test('should add environment variables', async () => {
      const envs = ['development', 'production']

      await pushEnvVars('test/fixtures/.env.test', envs, {
        prePush: (envVars) => {
          return { ...envVars, newKey: 'newValue' }
        },
      })

      const expectedCommands = getExpectedCommands(envs, {
        ...defaultExpectedEnvVars,
        newKey: 'newValue',
      })

      expect(execSpy.mock.calls.length).toBe(expectedCommands.length)

      for (const expectedCommand of expectedCommands) {
        expect(execSpy.mock.calls).toContainEqual(expectedCommand)
      }
    })

    test('should remove environment variables', async () => {
      const envs = ['development', 'production']

      await pushEnvVars('test/fixtures/.env.test', envs, {
        prePush: ({ keyA, keyB, ...otherEnvVars }) => {
          return otherEnvVars
        },
      })

      const expectedCommands = getExpectedCommands(envs, {
        keyAExpanded: 'valueA',
      })

      expect(execSpy.mock.calls.length).toBe(expectedCommands.length)

      for (const expectedCommand of expectedCommands) {
        expect(execSpy.mock.calls).toContainEqual(expectedCommand)
      }
    })

    test('should accept an asynchronous prePush transformer', async () => {
      const envs = ['development', 'production']

      await pushEnvVars('test/fixtures/.env.test', envs, {
        prePush: async (envVars) => {
          const secretValue = await getAsyncSecretValue()

          return { ...envVars, secretValue }
        },
      })

      const expectedCommands = getExpectedCommands(envs, {
        ...defaultExpectedEnvVars,
        secretValue: 'secretValue',
      })

      expect(execSpy.mock.calls.length).toBe(expectedCommands.length)

      for (const expectedCommand of expectedCommands) {
        expect(execSpy.mock.calls).toContainEqual(expectedCommand)
      }
    })

    test('should handle a prePush transformer throwing an exception', async () => {
      const envs = ['development', 'production']

      await expect(
        pushEnvVars('test/fixtures/.env.test', envs, {
          prePush: (envVars) => {
            if (Object.keys(envVars).length === Object.keys(defaultExpectedEnvVars).length) {
              throw new Error('prePush Error')
            }

            return envVars
          },
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot('"prePush Error"')
    })
  })
})

function getExpectedCommands(envs: string[], envVars: EnvVars) {
  const expectedCommands: string[][] = []

  for (const [envKey, envValue] of Object.entries(envVars)) {
    for (const env of envs) {
      expectedCommands.push(
        [`npx --yes vercel env rm ${envKey} ${env} -y`],
        [`printf "${envValue}" | npx --yes vercel env add ${envKey} ${env}`]
      )
    }
  }

  return expectedCommands
}

function getAsyncSecretValue() {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(`secretValue`)
    }, 10)
  })
}
