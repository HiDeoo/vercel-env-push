import assert from 'node:assert'

import wyt from 'wyt'

import { type EnvVars } from './file'
import { exec, isExecError } from './process'
import { throwIfAnyRejected } from './promise'

const vercelEnvs = ['development', 'preview', 'production'] as const

const rateLimiter = wyt(8, 10_000)

export function validateVercelEnvs(envs: string[]): asserts envs is VercelEnv[] {
  assert(envs.length > 0, 'No environments specified.')

  for (const env of envs) {
    assert((vercelEnvs as ReadonlyArray<string>).includes(env), `Unknown environment '${env}' specified.`)
  }
}

export async function replaceEnvVars(envs: VercelEnv[], envVars: EnvVars, token?: string) {
  await removeEnvVars(envs, envVars, token)
  await addEnvVars(envs, envVars, token)
}

async function removeEnvVars(envs: VercelEnv[], envVars: EnvVars, token?: string) {
  const promises: Promise<void>[] = []

  for (const envVarKey of Object.keys(envVars)) {
    for (const env of envs) {
      promises.push(removeEnvVar(env, envVarKey, token))
    }
  }

  throwIfAnyRejected(await Promise.allSettled(promises))
}

async function addEnvVars(envs: VercelEnv[], envVars: EnvVars, token?: string) {
  const promises: Promise<void>[] = []

  for (const [envVarKey, envVarValue] of Object.entries(envVars)) {
    for (const env of envs) {
      promises.push(addEnvVar(env, envVarKey, envVarValue, token))
    }
  }

  throwIfAnyRejected(await Promise.allSettled(promises))
}

async function addEnvVar(env: VercelEnv, key: string, value: string, token?: string) {
  try {
    await rateLimiter()

    await execCommandWithNpx(`printf "${value}" | npx vercel env add ${key} ${env}${getTokenCommandArgument(token)}`)
  } catch (error) {
    throw new Error(`Unable to add environment variable '${key}' to '${env}'.`, {
      cause: error instanceof Error ? error : undefined,
    })
  }
}

async function removeEnvVar(env: VercelEnv, key: string, token?: string) {
  try {
    await rateLimiter()

    await execCommandWithNpx(`npx vercel env rm ${key} ${env} -y${getTokenCommandArgument(token)}`)
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

function getTokenCommandArgument(token?: string) {
  return token && token.length > 0 ? ` -t ${token}` : ''
}

type VercelEnv = typeof vercelEnvs[number]
