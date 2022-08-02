import { type EnvVars, parseEnvFile, validateFile } from './libs/file'
import { confirm, redact, type Spinner, table, text, spin } from './libs/prompt'
import { pluralize } from './libs/string'
import { replaceEnvVars, validateVercelEnvs } from './libs/vercel'

export async function pushEnvVars(envFilePath: string, envs: string[], options?: Options) {
  validateVercelEnvs(envs, options?.branch)

  validateFile(envFilePath)

  if (options?.interactive) {
    logParams(envFilePath, envs, options?.branch)
  }

  let envVars = parseEnvFile(envFilePath)
  const envVarsCount = Object.keys(envVars).length

  if (options?.prePush) {
    envVars = await options.prePush(envVars)
  }

  if (options?.interactive) {
    logEnvVars(envVars, envVarsCount)
  }

  if (options?.dryRun) {
    return
  }

  if (options?.interactive) {
    await confirm(
      `Do you want to push ${pluralize(envVarsCount, 'this', 'these')} environment ${pluralize(
        envVarsCount,
        'variable'
      )}?`
    )
  }

  let spinner: Spinner | undefined

  if (options?.interactive) {
    spinner = spin(`Pushing environment ${pluralize(envVarsCount, 'variable')}`)
  }

  try {
    await replaceEnvVars(envs, envVars, { branch: options?.branch, token: options?.token })
  } catch (error) {
    if (options?.interactive && spinner) {
      spinner.error()
    }

    throw error
  }

  if (options?.interactive && spinner) {
    spinner.success({
      text: `Pushed ${envVarsCount} environment ${pluralize(envVarsCount, 'variable')} to ${envs.length} ${pluralize(
        envs.length,
        'environment'
      )}.`,
    })
  }
}

function logParams(envFilePath: string, envs: string[], branch?: string) {
  text(({ cyan, green, red, yellow }) => {
    const formatter = new Intl.ListFormat('en', { style: 'short', type: 'conjunction' })

    return `Preparing environment variables push from ${cyan(`'${envFilePath}'`)} to ${formatter.format(
      envs.map((env) => {
        if (env === 'development') {
          return green(env)
        } else if (env === 'preview') {
          return yellow(`${env}${branch ? ` (branch: ${branch})` : ''}`)
        }

        return red(env)
      })
    )}.`
  })
}

function logEnvVars(envVars: EnvVars, envVarsCount: number) {
  text(({ dim }) => dim(`The following environment ${pluralize(envVarsCount, 'variable')} will be pushed:`))
  table(({ bold }) => [
    [bold('Variable'), bold('Value')],
    Object.entries(envVars).map(([key, value]) => [key, redact(value)]),
  ])
}

interface Options {
  branch?: string
  dryRun?: boolean
  interactive?: boolean
  prePush?: (envVars: EnvVars) => EnvVars | Promise<EnvVars>
  token?: string
}
