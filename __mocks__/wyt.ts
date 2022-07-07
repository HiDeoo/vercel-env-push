import { vi } from 'vitest'

const rateLimiter = vi.fn()
const wyt = vi.fn(() => rateLimiter)

export default wyt
