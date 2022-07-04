import { describe, expect, test } from 'vitest'

import { pushEnvVars } from '../src'

describe('file', () => {
  test('should throw if the provided file does not exist', () => {
    expect(() => pushEnvVars('./unknown', ['production'])).toThrowErrorMatchingInlineSnapshot(
      '"No file found at \'./unknown\'."'
    )
  })
})
