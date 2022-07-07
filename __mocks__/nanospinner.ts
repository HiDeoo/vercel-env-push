import { type Spinner } from 'nanospinner'
import { type SpyInstance, vi } from 'vitest'

const spinner: Partial<{ [key in keyof Spinner]: SpyInstance }> = {
  error: vi.fn(() => spinner),
  start: vi.fn(() => spinner),
  success: vi.fn(() => spinner),
}

export const createSpinner = vi.fn(() => spinner)
