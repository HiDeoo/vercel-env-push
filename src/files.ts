import assert from 'node:assert'
import fs from 'node:fs'

export function validateFile(filePath: string) {
  assert(fs.existsSync(filePath), `No file found at '${filePath}'.`)
}
