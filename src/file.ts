import assert from 'node:assert'
import fs from 'node:fs'

import dotenv from 'dotenv'

export function validateFile(filePath: string) {
  assert(fs.existsSync(filePath), `No file found at '${filePath}'.`)
}

export function parseEnvFile(envFilePath: string): EnvVars {
  const content = fs.readFileSync(envFilePath, 'utf8')

  const envVars = dotenv.parse(content)

  if (Object.keys(envVars).length === 0) {
    throw new Error(`No environment variables found in '${envFilePath}'.`)
  }

  return envVars
}

type EnvVars = Record<string, string>
