import { vi } from 'vitest'

const rateLimiterMock = vi.fn()
const wytMock = vi.fn(() => rateLimiterMock)

export default wytMock
