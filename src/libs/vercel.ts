import assert from 'node:assert'

import wyt from 'wyt'

import { type EnvVars } from './file'
import { exec, isExecError } from './process'
import { throwIfAnyRejected } from './promise'

const knownVercelEnvs = ['development', 'preview', 'production'] as const
const customVercelEnvRegex = /^[\d_a-z-]+$/

let waitForRateLimiter: ReturnType<typeof wyt>

export function validateVercelEnvs(envs: string[], options?: ValidateVercelEnvsOptions): asserts envs is VercelEnv[] {
  assert(envs.length > 0, 'No environments specified.')

  for (const env of envs) {
    if (isKnownVercelEnv(env)) {
      continue
    }

    assert(options?.allowCustomEnv, `Unknown environment '${env}' specified.`)
    assert(customVercelEnvRegex.test(env), `Invalid custom environment '${env}' specified.`)
  }

  if (options?.branch && options.branch.length > 0) {
    assert(
      envs.length === 1 && envs[0] === 'preview',
      'Only the preview environment can be specified when specifying a branch.'
    )
  }
}

export async function replaceEnvVars(envs: VercelEnv[], envVars: EnvVars, options: VercelOptions) {
  await removeEnvVars(envs, envVars, options)
  await addEnvVars(envs, envVars, options)
}

async function removeEnvVars(envs: VercelEnv[], envVars: EnvVars, options: VercelOptions) {
  rateLimit()

  const promises: Promise<void>[] = []

  for (const envVarKey of Object.keys(envVars)) {
    for (const env of envs) {
      promises.push(removeEnvVar(env, envVarKey, options))
    }
  }

  throwIfAnyRejected(await Promise.allSettled(promises))
}

async function addEnvVars(envs: VercelEnv[], envVars: EnvVars, options: VercelOptions) {
  rateLimit()

  const promises: Promise<void>[] = []

  for (const [envVarKey, envVarValue] of Object.entries(envVars)) {
    for (const env of envs) {
      promises.push(addEnvVar(env, envVarKey, envVarValue, options))
    }
  }

  throwIfAnyRejected(await Promise.allSettled(promises))
}

async function addEnvVar(env: VercelEnv, key: string, value: string, options: VercelOptions) {
  try {
    await waitForRateLimiter()

    await execCommandWithNpx(
      `printf "${value}" | npx vercel env add ${key} ${env}${getBranchCommandArgument(
        options.branch
      )}${getTokenCommandArgument(options.token)}`
    )
  } catch (error) {
    throw new Error(`Unable to add environment variable '${key}' to '${env}'.`, {
      cause: error instanceof Error ? error : undefined,
    })
  }
}

async function removeEnvVar(env: VercelEnv, key: string, options: VercelOptions) {
  try {
    await waitForRateLimiter()

    await execCommandWithNpx(
      `npx vercel env rm ${key} ${env}${getBranchCommandArgument(options.branch)} -y${getTokenCommandArgument(
        options.token
      )}`
    )
  } catch (error) {
    if (!isExecError(error) || !error.stderr.includes('was not found')) {
      throw new Error(`Unable to remove environment variable '${key}' from '${env}'.`, {
        cause: error instanceof Error ? error : undefined,
      })
    }
  }
}

async function execCommandWithNpx(command: string) {
  return exec(command.replace('npx', 'npx --yes'))
}

function getTokenCommandArgument(token?: VercelOptions['token']) {
  return token && token.length > 0 ? ` -t ${token}` : ''
}

function getBranchCommandArgument(branch?: VercelOptions['branch']) {
  return branch && branch.length > 0 ? ` ${branch}` : ''
}

function rateLimit() {
  waitForRateLimiter = wyt(6, 10_000)
}

function isKnownVercelEnv(env: string): env is KnownVercelEnv {
  return (knownVercelEnvs as ReadonlyArray<string>).includes(env)
}

type KnownVercelEnv = typeof knownVercelEnvs[number]
type VercelEnv = string

interface ValidateVercelEnvsOptions {
  allowCustomEnv?: boolean
  branch?: string
}

interface VercelOptions {
  branch?: string
  token?: string
}
