import assert from 'node:assert'

import { type EnvVars } from './file'
import { exec, isExecError, throwIfAnyRejected } from './utils'

const vercelEnvs = ['development', 'preview', 'production'] as const

export function validateVercelEnvs(envs: string[]): asserts envs is VercelEnv[] {
  assert(envs.length > 0, 'No environments specified.')

  assert(
    envs.every((env) => (vercelEnvs as ReadonlyArray<string>).includes(env)),
    'Unknown environment(s) specified.'
  )
}

export async function replaceEnvVars(envs: VercelEnv[], envVars: EnvVars) {
  await removeEnvVars(envs, envVars)
  await addEnvVars(envs, envVars)
}

async function removeEnvVars(envs: VercelEnv[], envVars: EnvVars) {
  const promises: Promise<void>[] = []

  for (const envVarKey of Object.keys(envVars)) {
    for (const env of envs) {
      promises.push(removeEnvVar(env, envVarKey))
    }
  }

  throwIfAnyRejected(await Promise.allSettled(promises))
}

async function addEnvVars(envs: VercelEnv[], envVars: EnvVars) {
  const promises: Promise<void>[] = []

  for (const [envVarKey, envVarValue] of Object.entries(envVars)) {
    for (const env of envs) {
      promises.push(addEnvVar(env, envVarKey, envVarValue))
    }
  }

  throwIfAnyRejected(await Promise.allSettled(promises))
}

async function addEnvVar(env: VercelEnv, key: string, value: string) {
  try {
    await execCommandWithNpx(`printf "${value}" | npx vercel env add ${key} ${env}`)
  } catch (error) {
    throw new Error(`Unable to add environment variable '${key}' to '${env}'.`, {
      cause: error instanceof Error ? error : undefined,
    })
  }
}

async function removeEnvVar(env: VercelEnv, key: string) {
  try {
    await execCommandWithNpx(`npx vercel env rm ${key} ${env} -y`)
  } catch (error) {
    if (!isExecError(error) || !error.stderr.includes('Environment Variable was not found')) {
      throw new Error(`Unable to remove environment variable '${key}' from '${env}'.`, {
        cause: error instanceof Error ? error : undefined,
      })
    }
  }
}

async function execCommandWithNpx(command: string) {
  return exec(command.replace('npx', 'npx --yes'))
}

type VercelEnv = typeof vercelEnvs[number]
