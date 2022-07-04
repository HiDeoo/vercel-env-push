import assert from 'node:assert'

const vercelEnvs = ['development', 'preview', 'production'] as const

export function validateEnvs(envs: string[]): asserts envs is VercelEnv[] {
  assert(envs.length > 0, 'No environments specified.')

  assert(
    envs.every((env) => (vercelEnvs as ReadonlyArray<string>).includes(env)),
    'Unknown environment(s) specified.'
  )
}

type VercelEnv = typeof vercelEnvs[number]
