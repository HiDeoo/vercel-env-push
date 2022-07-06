import { execa } from 'execa'
import * as kolorist from 'kolorist'
import ora from 'ora'
import { afterAll, afterEach, beforeAll, describe, expect, type SpyInstance, test, vi } from 'vitest'

import { pushEnvVars } from '../src'
import * as prompt from '../src/prompt'

describe('prompt', () => {
  let confirmSpy: SpyInstance<Parameters<typeof prompt.confirm>, ReturnType<typeof prompt.confirm>>
  let tableSpy: SpyInstance<Parameters<typeof prompt.table>, ReturnType<typeof prompt.table>>
  let textSpy: SpyInstance<Parameters<typeof prompt.text>, ReturnType<typeof prompt.text>>

  beforeAll(() => {
    vi.mock('execa')
    vi.mock('ora', () => ({ default: vi.fn().mockImplementation(() => ({ start: vi.fn() })) }))

    confirmSpy = vi.spyOn(prompt, 'confirm')
    tableSpy = vi.spyOn(prompt, 'table').mockImplementation(() => '')
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

  test('should not log anything in non-interactive mode', async () => {
    await pushEnvVars('test/fixtures/.env.test', ['production'])

    expect(textSpy).not.toHaveBeenCalled()
  })

  test('should log the environment file path and push environments in interactive mode', async () => {
    confirmSpy.mockReturnValueOnce(Promise.resolve(true))

    await pushEnvVars('test/fixtures/.env.test', ['development', 'preview', 'production'], { interactive: true })

    expect(textSpy.mock.calls[0]?.[0](kolorist)).toMatchInlineSnapshot(
      '"Preparing environment variables push from \'test/fixtures/.env.test\' to development, preview, & production."'
    )
  })

  test('should log redacted environment variables in interactive mode', async () => {
    confirmSpy.mockReturnValueOnce(Promise.resolve(true))

    await pushEnvVars('test/fixtures/.env.test', ['production'], { interactive: true })

    expect(textSpy.mock.calls[1]?.[0](kolorist)).toMatchInlineSnapshot(`
      "
      The following environment variable(s) will be pushed:"
    `)

    expect(tableSpy).toHaveBeenCalledOnce()
    expect(tableSpy.mock.calls[0]?.[0](kolorist)).toMatchInlineSnapshot(`
      [
        [
          "Variable",
          "Value",
        ],
        [
          [
            "keyA",
            "v****A",
          ],
          [
            "keyAExpanded",
            "v****A",
          ],
          [
            "keyB",
            "v****B",
          ],
        ],
      ]
    `)
  })

  test('should not show a spinner in non-interactive mode', async () => {
    await pushEnvVars('test/fixtures/.env.test', ['production'])

    const spinSpy = vi.mocked(ora)

    expect(spinSpy).not.toHaveBeenCalled()
  })

  test('should show a spinner in interactive mode', async () => {
    confirmSpy.mockReturnValueOnce(Promise.resolve(true))

    await pushEnvVars('test/fixtures/.env.test', ['production'], { interactive: true })

    const spinSpy = vi.mocked(ora)

    expect(spinSpy).toHaveBeenCalledOnce()
  })
})

describe('redact', () => {
  test.each([
    ['a', '*'],
    ['ab', '**'],
    ['abc', '***'],
    ['abcd', '****'],
    ['abcde', 'a***e'],
    ['abcdefghijklmnopqrstuvwxyz', `a${'*'.repeat(24)}z`],
    ['12345', '1***5'],
  ])("should properly redact '%s'", async (value, redactedValue) => {
    expect(prompt.redact(value)).toBe(redactedValue)
  })
})
