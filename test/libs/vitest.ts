import { type SpyInstance } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Spy<TFn extends (...args: any[]) => any> = SpyInstance<Parameters<TFn>, ReturnType<TFn>>
