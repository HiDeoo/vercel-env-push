import { execa, type ExecaChildProcess, type Options as ExecaOptions } from 'execa'
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
    vi.mock('execa')
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

    const expectedCalls: ExecaParams[] = []

    for (const [envKey, envValue] of Object.entries(envVars)) {
      for (const env of envs) {
        expectedCalls.push(
          ['npx', ['--yes', 'vercel', 'env', 'rm', envKey, env, '-y'], { shell: true }],
          ['printf', [`"${envValue}"`, '|', 'npx', '--yes', 'vercel', 'env', 'add', envKey, env], { shell: true }]
        )
      }
    }

    const execaSpy = vi.mocked<(...params: ExecaParams) => ExecaChildProcess>(execa)

    expect(execaSpy.mock.calls.length).toBe(expectedCalls.length)

    for (const expectedCall of expectedCalls) {
      expect(execaSpy.mock.calls).toContainEqual(expectedCall)
    }
  })

  test('should not push environment variables with the dry option', async () => {
    await pushEnvVars('test/fixtures/.env.test', ['production'], { dryRun: true })

    const execaSpy = vi.mocked(execa)

    expect(execaSpy).not.toHaveBeenCalled()
  })
})

type ExecaParams = [file: string, args?: string[], options?: ExecaOptions]
