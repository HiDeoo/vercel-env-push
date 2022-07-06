import assert from 'node:assert'

import { type EnvVars } from './file'

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

  return Promise.all(promises)
}

async function addEnvVars(envs: VercelEnv[], envVars: EnvVars) {
  const promises: Promise<void>[] = []

  for (const [envVarKey, envVarValue] of Object.entries(envVars)) {
    for (const env of envs) {
      promises.push(addEnvVar(env, envVarKey, envVarValue))
    }
  }

  return Promise.all(promises)
}

async function addEnvVar(env: VercelEnv, key: string, value: string) {
  try {
    // https://stackoverflow.com/a/68039150/1945960
    await executeCommandWithNpx('printf', `"${value}"`, '|', 'npx', 'vercel', 'env', 'add', key, env)
  } catch {
    throw new Error(`Unable to add environment variable '${key}' to '${env}'.`)
  }
}

async function removeEnvVar(env: VercelEnv, key: string) {
  try {
    await executeCommandWithNpx('npx', 'vercel', 'env', 'rm', key, env, '-y')
  } catch {
    // We do not care about errors when removing an enviroment variable as they may simply not exist.
  }
}

async function executeCommandWithNpx(command: string, ...args: string[]) {
  const execaArgs: string[] = []

  if (command === 'npx') {
    execaArgs.push('--yes')
  }

  for (const arg of args) {
    execaArgs.push(arg)

    if (arg === 'npx') {
      execaArgs.push('--yes')
    }
  }

  const { execa } = await import('execa')

  return execa(command, execaArgs, { shell: true })
}

type VercelEnv = typeof vercelEnvs[number]
