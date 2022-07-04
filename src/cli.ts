import cac from 'cac'

import { version } from '../package.json'

import { pushEnvVars } from '.'

const cli = cac('vercel-env-push')

cli.version(version).help()

// TODO(HiDeoo) List possible env accepted values

cli
  .command('<file> <env> [...otherEnvs]')
  .option('--dry, --dry-run', 'List environment variables without pushing them')
  .action((file: string, env: string, otherEnvs: string[], options: Options) => {
    // FIXME(HiDeoo)
    console.log(`🚨 [cli.ts:16] file "${file}"`)
    console.log('🚨 [cli.ts:17] env', env)
    console.log('🚨 [cli.ts:18] otherEnvs', otherEnvs)
    console.log('🚨 [cli.ts:19] options', options)

    pushEnvVars(file, [env, ...otherEnvs], options)
  })

try {
  cli.parse()
} catch (error) {
  if (error instanceof Error) {
    // TODO(HiDeoo) Display error message properly
    console.error('🚨 [cli.ts:24] error', error, '\n\n')
  }

  cli.outputHelp()

  process.exit(1)
}

interface Options {
  dryRun?: boolean
}
