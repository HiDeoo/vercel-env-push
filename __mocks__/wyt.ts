import { vi } from 'vitest'

const rateLimiter = vi.fn()

const wytMock = vi.fn(() => rateLimiter)

export default wytMock
