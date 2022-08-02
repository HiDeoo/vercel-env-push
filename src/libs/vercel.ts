import assert from 'node:assert'

import wyt from 'wyt'

import { type EnvVars } from './file'
import { exec, isExecError } from './process'
import { throwIfAnyRejected } from './promise'

const vercelEnvs = ['development', 'preview', 'production'] as const

const rateLimiter = wyt(8, 10_000)

export function validateVercelEnvs(envs: string[], branch?: string): asserts envs is VercelEnv[] {
  assert(envs.length > 0, 'No environments specified.')

  for (const env of envs) {
    assert((vercelEnvs as ReadonlyArray<string>).includes(env), `Unknown environment '${env}' specified.`)
  }

  if (branch && branch.length > 0) {
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
  const promises: Promise<void>[] = []

  for (const envVarKey of Object.keys(envVars)) {
    for (const env of envs) {
      promises.push(removeEnvVar(env, envVarKey, options))
    }
  }

  throwIfAnyRejected(await Promise.allSettled(promises))
}

async function addEnvVars(envs: VercelEnv[], envVars: EnvVars, options: VercelOptions) {
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
    await rateLimiter()

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
    await rateLimiter()

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

type VercelEnv = typeof vercelEnvs[number]

interface VercelOptions {
  branch?: string
  token?: string
}
