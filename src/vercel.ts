import assert from 'node:assert'

const vercelEnvs = ['development', 'preview', 'production'] as const

export function validateVercelEnvs(envs: string[]): asserts envs is VercelEnv[] {
  assert(envs.length > 0, 'No environments specified.')

  assert(
    envs.every((env) => (vercelEnvs as ReadonlyArray<string>).includes(env)),
    'Unknown environment(s) specified.'
  )
}

export async function pushEnvVar(
  envs: VercelEnv[],
  key: string,
  value: string,
  onPush: (env: VercelEnv, key: string) => void
) {
  for (const env of envs) {
    onPush(env, key)

    await removeEnvVar(env, key)
    await addEnvVar(env, key, value)
  }
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
