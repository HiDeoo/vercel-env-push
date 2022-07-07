import { exec as execute } from 'node:child_process'
import { promisify } from 'node:util'

export const exec = promisify(execute)

export function isExecError(error: unknown): error is ExecError {
  return error instanceof Error && typeof (error as ExecError).stderr === 'string'
}

interface ExecError extends Error {
  stderr: string
  stdout: string
}
