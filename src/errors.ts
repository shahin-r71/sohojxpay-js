import type { ApiErrorPayload } from './types.js'

export class SohojxPayApiError extends Error {
  readonly name = 'SohojxPayApiError'
  readonly status: number
  readonly code?: string
  readonly payload?: ApiErrorPayload | unknown

  constructor(message: string, options: { status: number; code?: string; payload?: unknown }) {
    super(message)
    this.status = options.status
    this.code = options.code
    this.payload = options.payload
  }
}
