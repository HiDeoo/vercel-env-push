import cac from 'cac'
import { red } from 'kolorist'

import { version } from '../package.json'

import { pushEnvVars } from '.'

const cli = cac('vercel-env-push')

cli.version(version).help()

// TODO(HiDeoo) List possible env accepted values

cli
  .command('<file> <env> [...otherEnvs]')
  .option('--dry, --dry-run', 'List environment variables without pushing them')
  .action(async (file: string, env: string, otherEnvs: string[], options: CliOptions) => {
    await pushEnvVars(file, [env, ...otherEnvs], { ...options, interactive: true })
  })

try {
  cli.parse()
} catch (error) {
  console.error(red(`Something went wrong: ${error instanceof Error ? error.message : error}\n`))

  cli.outputHelp()

  process.exit(1)
}

interface CliOptions {
  dryRun?: boolean
}
