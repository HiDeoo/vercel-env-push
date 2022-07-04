import { validateEnvs } from './env'

// TODO(HiDeoo) Type options - allow undefined?
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function pushEnvVars(_file: string, envs: string[], _options?: unknown) {
  validateEnvs(envs)

  // TODO(HiDeoo) Display envs

  // TODO(HiDeoo) Check file exists and is readable?

  // TODO(HiDeoo) Display file name or maybe complete path

  // TODO(HiDeoo) Parse env with expand

  // TODO(HiDeoo) Display enviroment variables

  // TODO(HiDeoo) Check if dry run and cancel if yes

  // TODO(HiDeoo) Push enviroment variables
}
