import { execa } from 'execa'
import * as kolorist from 'kolorist'
import { afterAll, afterEach, beforeAll, describe, expect, type SpyInstance, test, vi } from 'vitest'

import { pushEnvVars } from '../src'
import * as prompt from '../src/prompt'

describe('prompt', () => {
  let confirmSpy: SpyInstance<Parameters<typeof prompt.confirm>, ReturnType<typeof prompt.confirm>>
  let textSpy: SpyInstance<Parameters<typeof prompt.text>, ReturnType<typeof prompt.text>>

  beforeAll(() => {
    vi.mock('execa', () => ({ execa: vi.fn() }))

    confirmSpy = vi.spyOn(prompt, 'confirm')
    textSpy = vi.spyOn(prompt, 'text').mockImplementation(() => '')
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should not ask for confirmation in non-interactive mode', async () => {
    await pushEnvVars('test/fixtures/.env.test', ['production'])

    expect(confirmSpy).not.toHaveBeenCalled()
  })

  test('should not push environment variables in interactive mode with no confirmation', async () => {
    confirmSpy.mockReturnValueOnce(Promise.resolve(false))

    await expect(
      pushEnvVars('test/fixtures/.env.test', ['production'], { interactive: true })
    ).rejects.toThrowErrorMatchingInlineSnapshot('"User aborted."')

    const execaSpy = vi.mocked(execa)

    expect(execaSpy).not.toHaveBeenCalled()
  })

  test('should push environment variables in interactive mode with a confirmation', async () => {
    confirmSpy.mockReturnValueOnce(Promise.resolve(true))

    await pushEnvVars('test/fixtures/.env.test', ['production'], { interactive: true })

    const execaSpy = vi.mocked(execa)

    expect(execaSpy).toHaveBeenCalledTimes(6)
  })

  test('should not log anything in interactive mode', async () => {
    await pushEnvVars('test/fixtures/.env.test', ['production'])

    expect(confirmSpy).not.toHaveBeenCalled()
  })

  test('should log the environment file path and push environments', async () => {
    confirmSpy.mockReturnValueOnce(Promise.resolve(true))

    await pushEnvVars('test/fixtures/.env.test', ['development', 'preview', 'production'], { interactive: true })

    expect(textSpy.mock.calls[0]?.[0](kolorist)).toMatchInlineSnapshot(
      '"Preparing environment variables push from \'test/fixtures/.env.test\' to development, preview, & production."'
    )
  })
})
