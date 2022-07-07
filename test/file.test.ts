import { describe, expect, test } from 'vitest'

import { pushEnvVars } from '../src'

describe('file', () => {
  test('should throw if the provided file does not exist', async () => {
    await expect(pushEnvVars('test/fixtures/.env.unknown', ['production'])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"No file found at \'test/fixtures/.env.unknown\'."'
    )
  })
})

describe('dotenv', () => {
  test('should throw if the file does not contain any environment variables', async () => {
    await expect(pushEnvVars('test/fixtures/.env.empty', ['production'])).rejects.toThrowErrorMatchingInlineSnapshot(
      '"No environment variables found in \'test/fixtures/.env.empty\'."'
    )
  })

  test('should throw if an environment variable fails to expand', async () => {
    await expect(
      pushEnvVars('test/fixtures/.env.expand.error', ['production'])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Unable to parse and expand environment variables in \'test/fixtures/.env.expand.error\'."'
    )
  })
})
