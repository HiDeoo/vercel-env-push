import assert from 'node:assert'
import fs from 'node:fs'

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

export function validateFile(filePath: string) {
  assert(fs.existsSync(filePath), `No file found at '${filePath}'.`)
}

export function parseEnvFile(envFilePath: string): EnvVars {
  const content = fs.readFileSync(envFilePath, 'utf8')

  const envVars = dotenv.parse(content)

  if (Object.keys(envVars).length === 0) {
    throw new Error(`No environment variables found in '${envFilePath}'.`)
  }

  try {
    const parsedEnvVars = dotenvExpand.expand({ ignoreProcessEnv: true, parsed: envVars })

    if (!parsedEnvVars.parsed || parsedEnvVars.error) {
      throw new Error('Unable to expand environment variables.')
    }

    return parsedEnvVars.parsed
  } catch {
    throw new Error(`Unable to parse and expand environment variables in '${envFilePath}'.`)
  }
}

type EnvVars = Record<string, string>
