import { describe, expect, test } from 'vitest'

import { pushEnvVars } from '../src'

describe('env', () => {
  test('should throw if no environments are provided', () => {
    expect(() => pushEnvVars('', [])).toThrowErrorMatchingInlineSnapshot('"No environments specified."')
  })

  test('should throw if an unknown environment is provided', () => {
    expect(() => pushEnvVars('', ['test'])).toThrowErrorMatchingInlineSnapshot('"Unknown environment(s) specified."')
  })

  test('should throw if multiple unknown environments are provided', () => {
    expect(() => pushEnvVars('', ['test', 'staging'])).toThrowErrorMatchingInlineSnapshot(
      '"Unknown environment(s) specified."'
    )
  })

  test('should throw if an unknown environment is provided with known environments', () => {
    expect(() => pushEnvVars('', ['production', 'test'])).toThrowErrorMatchingInlineSnapshot(
      '"Unknown environment(s) specified."'
    )
  })
})
