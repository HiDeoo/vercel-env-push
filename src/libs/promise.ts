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
