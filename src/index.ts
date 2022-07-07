import { parseEnvFile, validateFile } from './libs/file'
import { confirm, redact, type Spinner, table, text, spin } from './libs/prompt'
import { replaceEnvVars, validateVercelEnvs } from './libs/vercel'

export async function pushEnvVars(envFilePath: string, envs: string[], options?: Options) {
  validateVercelEnvs(envs)

  validateFile(envFilePath)

  if (options?.interactive) {
    text(({ cyan }) => {
      const formatter = new Intl.ListFormat('en', { style: 'short', type: 'conjunction' })

      return `Preparing environment variables push from ${cyan(`'${envFilePath}'`)} to ${formatter.format(
        envs.map((env) => cyan(env))
      )}.`
    })
  }

  const envVars = parseEnvFile(envFilePath)

  if (options?.interactive) {
    text(({ dim }) => dim('\nThe following environment variable(s) will be pushed:'))
    table(({ bold }) => [
      [bold('Variable'), bold('Value')],
      Object.entries(envVars).map(([key, value]) => [key, redact(value)]),
    ])
  }

  if (options?.dryRun) {
    return
  }

  if (options?.interactive) {
    const confirmed = await confirm('\nDo you want to push these environment variable(s)?')

    if (!confirmed) {
      throw new Error('User aborted.')
    }
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
      text(() => '\n')
    }

    throw error
  }

  if (options?.interactive && spinner) {
    spinner.success({
      text: `Pushed ${Object.keys(envVars).length} environment variable(s) to ${envs.length} environment(s).`,
    })
  }
}

interface Options {
  dryRun?: boolean
  interactive?: boolean
}
