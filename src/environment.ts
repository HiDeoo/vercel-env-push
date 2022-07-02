import assert from 'node:assert'

// TODO(HiDeoo) Use a type guard to make it an array of known values
export function validateEnvironments(environments: string[]) {
  assert(environments.length > 0, 'No environments specified.')

  // TODO(HiDeoo) Validate known possible environments
}
