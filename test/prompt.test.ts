import * as kolorist from 'kolorist'
import { createSpinner } from 'nanospinner'
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

import { pushEnvVars } from '../src'
import * as process from '../src/libs/process'
import * as prompt from '../src/libs/prompt'

import { type Spy } from './libs/vitest'

describe('prompt', () => {
  let execSpy: Spy<typeof process.exec>

  let confirmSpy: Spy<typeof prompt.confirm>
  let spinSpy: Spy<typeof prompt.spin>
  let tableSpy: Spy<typeof prompt.table>
  let textSpy: Spy<typeof prompt.text>

  beforeAll(() => {
    vi.mock('nanospinner')
    vi.mock('wyt')

    execSpy = vi.spyOn(process, 'exec').mockImplementation(vi.fn<[string]>())

    confirmSpy = vi.spyOn(prompt, 'confirm')
    confirmSpy = vi.spyOn(prompt, 'confirm')
    spinSpy = vi.spyOn(prompt, 'spin')
    tableSpy = vi.spyOn(prompt, 'table').mockReturnValue()
    textSpy = vi.spyOn(prompt, 'text').mockReturnValue()
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
    confirmSpy.mockRejectedValue(new Error('test'))

    await expect(pushEnvVars('test/fixtures/.env.test', ['production'], { interactive: true })).rejects.toThrowError()

    expect(execSpy).not.toHaveBeenCalled()
  })

  test('should push environment variables in interactive mode with a confirmation', async () => {
    confirmSpy.mockResolvedValue()

    await pushEnvVars('test/fixtures/.env.test', ['production'], { interactive: true })

    expect(execSpy).toHaveBeenCalledTimes(6)
  })

  test('should not log anything in non-interactive mode', async () => {
    await pushEnvVars('test/fixtures/.env.test', ['production'])

    expect(textSpy).not.toHaveBeenCalled()
  })

  test('should log the environment file path and push environments in interactive mode', async () => {
    confirmSpy.mockResolvedValue()

    await pushEnvVars('test/fixtures/.env.test', ['development', 'preview', 'production'], { interactive: true })

    expect(textSpy.mock.calls[0]?.[0](kolorist)).toMatchInlineSnapshot(
      '"Preparing environment variables push from \'test/fixtures/.env.test\' to development, preview, & production."'
    )
  })

  test('should log redacted environment variables in interactive mode', async () => {
    confirmSpy.mockResolvedValue()

    await pushEnvVars('test/fixtures/.env.test', ['production'], { interactive: true })

    expect(textSpy.mock.calls[1]?.[0](kolorist)).toMatchInlineSnapshot(
      '"The following environment variable(s) will be pushed:"'
    )

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

    expect(spinSpy).not.toHaveBeenCalled()
  })

  test('should show a spinner in interactive mode', async () => {
    confirmSpy.mockResolvedValue()

    await pushEnvVars('test/fixtures/.env.test', ['production'], { interactive: true })

    expect(spinSpy).toHaveBeenCalledOnce()

    const spinnerMock = vi.mocked(createSpinner).mock.results[0]?.value

    expect(spinnerMock.start).toHaveBeenCalledOnce()
    expect(spinnerMock.success).toHaveBeenCalledOnce()
  })

  test('should show an error symbol instead of a spinner when encountering an error in interactive mode', async () => {
    execSpy.mockRejectedValueOnce(new Error('test'))

    confirmSpy.mockResolvedValue()

    await expect(pushEnvVars('test/fixtures/.env.test', ['production'], { interactive: true })).rejects.toThrow()

    expect(spinSpy).toHaveBeenCalledOnce()

    const spinnerMock = vi.mocked(createSpinner).mock.results[0]?.value

    expect(spinnerMock.start).toHaveBeenCalledOnce()
    expect(spinnerMock.error).toHaveBeenCalledOnce()
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
