import { parseEnvFile, validateFile } from './file'
import { confirm, text } from './prompt'
import { pushEnvVar, validateVercelEnvs } from './vercel'

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

  // TODO(HiDeoo) Display enviroment variables

  if (options?.dryRun) {
    return
  }

  if (options?.interactive) {
    const confirmed = await confirm('Do the thing????')

    if (!confirmed) {
      throw new Error('User aborted.')
    }
  }

  for (const [envVarKey, envVarValue] of Object.entries(envVars)) {
    await pushEnvVar(envs, envVarKey, envVarValue)
  }
}

interface Options {
  dryRun?: boolean
  interactive?: boolean
}
