import { type EnvVars, parseEnvFile, validateFile } from './libs/file'
import { confirm, redact, type Spinner, table, text, spin } from './libs/prompt'
import { replaceEnvVars, validateVercelEnvs } from './libs/vercel'

export async function pushEnvVars(envFilePath: string, envs: string[], options?: Options) {
  validateVercelEnvs(envs)

  validateFile(envFilePath)

  if (options?.interactive) {
    logParams(envFilePath, envs)
  }

  const envVars = parseEnvFile(envFilePath)

  if (options?.interactive) {
    logEnvVars(envVars)
  }

  if (options?.dryRun) {
    return
  }

  if (options?.interactive) {
    await confirm('Do you want to push these environment variable(s)?')
  }

  let spinner: Spinner | undefined

  if (options?.interactive) {
    spinner = spin('Pushing environment variables')
  }

  try {
    await replaceEnvVars(envs, envVars)
  } catch (error) {
    if (options?.interactive && spinner) {
      spinner.error()
    }

    throw error
  }

  if (options?.interactive && spinner) {
    spinner.success({
      text: `Pushed ${Object.keys(envVars).length} environment variable(s) to ${envs.length} environment(s).`,
    })
  }
}

function logParams(envFilePath: string, envs: string[]) {
  text(({ cyan, green, red, yellow }) => {
    const formatter = new Intl.ListFormat('en', { style: 'short', type: 'conjunction' })

    return `Preparing environment variables push from ${cyan(`'${envFilePath}'`)} to ${formatter.format(
      envs.map((env) => {
        if (env === 'development') {
          return green(env)
        } else if (env === 'preview') {
          return yellow(env)
        }

        return red(env)
      })
    )}.`
  })
}

function logEnvVars(envVars: EnvVars) {
  text(({ dim }) => dim('The following environment variable(s) will be pushed:'))
  table(({ bold }) => [
    [bold('Variable'), bold('Value')],
    Object.entries(envVars).map(([key, value]) => [key, redact(value)]),
  ])
}

interface Options {
  dryRun?: boolean
  interactive?: boolean
}
