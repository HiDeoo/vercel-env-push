import { validateEnvs } from './env'
import { parseEnvFile, validateFile } from './file'

export function pushEnvVars(envFilePath: string, envs: string[], options?: Options) {
  // FIXME(HiDeoo)
  console.warn('🚨 [index.ts:7] options', options)

  validateEnvs(envs)

  // TODO(HiDeoo) Display envs

  validateFile(envFilePath)

  // TODO(HiDeoo) Display file name or maybe complete path

  parseEnvFile(envFilePath)

  // TODO(HiDeoo) Display enviroment variables

  // TODO(HiDeoo) Check if dry run and cancel if yes

  // TODO(HiDeoo) Wait for confirmation (except if -f or something)

  // TODO(HiDeoo) Push enviroment variables
}

interface Options {
  dryRun?: boolean
}
