import cac from 'cac'
import { red } from 'kolorist'

import { version } from '../package.json'

import { pushEnvVars } from '.'

const cli = cac('vercel-env-push')

cli.version(version).help((sections) => {
  sections.splice(3, 0, {
    body: 'Default environments: development - preview - production (use --allow-custom-env for custom slugs)',
  })
})

cli
  .command('<file> <env> [...otherEnvs]')
  .option('--allow-custom-env', 'Allow custom environment slugs (e.g. staging)')
  .option('--dry, --dry-run', 'List environment variables without pushing them')
  .option('-t, --token <token>', 'Login token to use for pushing environment variables')
  .option('-b, --branch <branch>', 'Specific git branch for pushed preview environment variables')
  .option('-y, --yes', 'Skip confirmation prompt for pushing environment variables')
  .action(async (file: string, env: string, otherEnvs: string[], options: CliOptions) => {
    await pushEnvVars(file, [env, ...otherEnvs], { ...options, interactive: true })
  })

async function run() {
  try {
    cli.parse(process.argv, { run: false })

    await cli.runMatchedCommand()
  } catch (error) {
    const isError = error instanceof Error

    console.error(red(`Something went wrong: ${isError ? error.message : error}`))

    if (isError && error.cause) {
      console.error(error.cause)
    }

    process.exit(1)
  }
}

run()

interface CliOptions {
  allowCustomEnv?: boolean
  branch?: string
  dryRun?: boolean
  token?: string
  yes?: boolean
}
