import { validateEnvs } from './env'
import { validateFile } from './files'

export function pushEnvVars(envFilePath: string, envs: string[], options?: Options) {
  // FIXME(HiDeoo)
  console.warn('🚨 [index.ts:7] options', options)

  validateEnvs(envs)

  // TODO(HiDeoo) Display envs

  validateFile(envFilePath)

  // TODO(HiDeoo) Display file name or maybe complete path

  // TODO(HiDeoo) Parse env with expand

  // TODO(HiDeoo) Display enviroment variables

  // TODO(HiDeoo) Check if dry run and cancel if yes

  // TODO(HiDeoo) Push enviroment variables
}

interface Options {
  dryRun?: boolean
}
