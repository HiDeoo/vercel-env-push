import cac from 'cac'
import { red } from 'kolorist'

import { version } from '../package.json'

import { pushEnvVars } from '.'

const cli = cac('vercel-env-push')

cli.version(version).help((sections) => {
  sections.splice(3, 0, {
    body: 'Environments: development - preview - production',
  })
})

cli
  .command('<file> <env> [...otherEnvs]')
  .option('--dry, --dry-run', 'List environment variables without pushing them')
  .option('-t, --token <token>', 'Login token to use for pushing environment variables')
  .option('-b, --branch <branch>', 'Specific git branch for pushed preview environment variables')
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
  branch?: string
  dryRun?: boolean
  token?: string
}
