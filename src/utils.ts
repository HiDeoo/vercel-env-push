import { exec as execute } from 'node:child_process'
import { promisify } from 'node:util'

export const exec = promisify(execute)

export function isExecError(error: unknown): error is ExecError {
  return error instanceof Error && typeof (error as ExecError).stderr === 'string'
}

export function throwIfAnyRejected(results: PromiseSettledResult<unknown>[]): void {
  for (const result of results) {
    if (isRejected(result)) {
      throw result.reason
    }
  }
}

function isRejected(input: PromiseSettledResult<unknown>): input is PromiseRejectedResult {
  return input.status === 'rejected'
}

interface ExecError extends Error {
  stderr: string
  stdout: string
}
