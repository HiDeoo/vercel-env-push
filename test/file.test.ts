import { describe, expect, test } from 'vitest'

import { pushEnvVars } from '../src'

describe('file', () => {
  test('should throw if the provided file does not exist', () => {
    expect(() => pushEnvVars('./fixtures/unknown', ['production'])).toThrowErrorMatchingInlineSnapshot(
      '"No file found at \'./fixtures/unknown\'."'
    )
  })

  test('should throw if the file does not contain any values', () => {
    expect(() => pushEnvVars('./test/fixtures/.env.empty', ['production'])).toThrowErrorMatchingInlineSnapshot(
      '"No environment variables found in \'./test/fixtures/.env.empty\'."'
    )
  })

  test('should throw if an environment variable fails to expand', () => {
    expect(() => pushEnvVars('./test/fixtures/.env.expand.error', ['production'])).toThrowErrorMatchingInlineSnapshot(
      '"Unable to parse and expand environment variables in \'./test/fixtures/.env.expand.error\'."'
    )
  })
})
