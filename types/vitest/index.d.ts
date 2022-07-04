declare namespace Vi {
  interface JestAssertion<T = T> {
    toHaveBeenNthAddEnvCall(times: number, env: string, key: string, value: string): void
    toHaveBeenNthRemoveEnvCall(times: number, env: string, key: string): void
  }
}
