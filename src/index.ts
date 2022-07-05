import { parseEnvFile, validateFile } from './file'
import { confirm } from './prompt'
import { pushEnvVar, validateVercelEnvs } from './vercel'

export async function pushEnvVars(envFilePath: string, envs: string[], options?: Options) {
  validateVercelEnvs(envs)

  // TODO(HiDeoo) Display envs

  validateFile(envFilePath)

  // TODO(HiDeoo) Display file name or maybe complete path

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
