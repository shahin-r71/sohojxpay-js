import { SohojxPayApiError } from './errors.js'
import type {
  BillCreatePayload,
  BillDetailResponse,
  BillListParams,
  BillListResponse,
  BulkCsvInput,
  BulkCsvOptions,
  BulkProcessSummary,
  ClientOptions,
  FetchLike,
  MfsCreatePayload,
  MfsDetailResponse,
  MfsListParams,
  MfsListResponse,
  RechargeBalanceResponse,
  RechargeDetailsParams,
  RechargeDetailsResponse,
  RechargeSubmitPayload,
  RechargeSubmitResponse,
} from './types.js'

type QueryParams = Record<string, string | number | boolean | undefined | null>

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}

function buildUrl(baseUrl: string, path: string, query?: QueryParams) {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${path}`)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }

  return url
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json().catch(() => undefined)
  }

  const text = await response.text().catch(() => '')
  if (!text) return undefined

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function buildError(response: Response, payload: unknown) {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
  const message =
    typeof record.message === 'string'
      ? record.message
      : typeof record.error === 'string'
        ? record.error
        : `SohojxPay API request failed with HTTP ${response.status}`

  const code =
    typeof record.code === 'string'
      ? record.code
      : typeof record.status === 'string'
        ? record.status
        : undefined

  return new SohojxPayApiError(message, {
    status: response.status,
    code,
    payload,
  })
}

function createCsvFormData(input: BulkCsvInput, filename: string) {
  if (input instanceof FormData) return input

  const formData = new FormData()
  const file = typeof input === 'string' ? new Blob([input], { type: 'text/csv' }) : input
  formData.append('file', file, filename)
  return formData
}

function normalizeAmountPayload<T extends { amount?: string | number }>(payload: T): T {
  if (typeof payload.amount !== 'number') return payload
  return { ...payload, amount: String(payload.amount) }
}

export class SohojxPayClient {
  readonly baseUrl: string
  private readonly serviceApiKey: string
  private readonly fetchImpl: FetchLike
  private readonly timeoutMs?: number

  constructor(options: ClientOptions) {
    if (!options.baseUrl) {
      throw new Error('SohojxPay client requires baseUrl')
    }
    if (!options.serviceApiKey) {
      throw new Error('SohojxPay client requires serviceApiKey')
    }

    this.baseUrl = normalizeBaseUrl(options.baseUrl)
    this.serviceApiKey = options.serviceApiKey
    this.fetchImpl = options.fetch ?? globalThis.fetch?.bind(globalThis)
    this.timeoutMs = options.timeoutMs

    if (!this.fetchImpl) {
      throw new Error('SohojxPay client requires a fetch implementation')
    }
  }

  readonly recharge = {
    getBalance: () => this.request<RechargeBalanceResponse>('GET', '/api/v1/recharge/balance'),
    submit: (payload: RechargeSubmitPayload) =>
      this.request<RechargeSubmitResponse>('POST', '/api/v1/recharge/request', {
        body: normalizeAmountPayload(payload),
      }),
    bulk: (input: BulkCsvInput, options: BulkCsvOptions = {}) =>
      this.request<BulkProcessSummary>('POST', '/api/v1/recharge/bulk', {
        body: createCsvFormData(input, options.filename ?? 'recharge-bulk.csv'),
      }),
    getDetails: (params: RechargeDetailsParams) =>
      this.request<RechargeDetailsResponse>('GET', '/api/v1/recharge/details', {
        query: { tran_id: params.tranId },
      }),
  }

  readonly bills = {
    list: (params: BillListParams = {}) =>
      this.request<BillListResponse>('GET', '/api/v1/bills', { query: { ...params } }),
    create: (payload: BillCreatePayload) =>
      this.request<BillDetailResponse>('POST', '/api/v1/bills', { body: normalizeAmountPayload(payload) }),
    bulk: (input: BulkCsvInput, options: BulkCsvOptions = {}) =>
      this.request<BulkProcessSummary>('POST', '/api/v1/bills/bulk', {
        body: createCsvFormData(input, options.filename ?? 'bills-bulk.csv'),
      }),
    get: (id: string) => this.request<BillDetailResponse>('GET', `/api/v1/bills/${encodeURIComponent(id)}`),
  }

  readonly mfs = {
    list: (params: MfsListParams = {}) =>
      this.request<MfsListResponse>('GET', '/api/v1/mfs', { query: { ...params } }),
    create: (payload: MfsCreatePayload) =>
      this.request<MfsDetailResponse>('POST', '/api/v1/mfs', { body: normalizeAmountPayload(payload) }),
    bulk: (input: BulkCsvInput, options: BulkCsvOptions = {}) =>
      this.request<BulkProcessSummary>('POST', '/api/v1/mfs/bulk', {
        body: createCsvFormData(input, options.filename ?? 'mfs-bulk.csv'),
      }),
    get: (id: string) => this.request<MfsDetailResponse>('GET', `/api/v1/mfs/${encodeURIComponent(id)}`),
  }

  private async request<T>(
    method: string,
    path: string,
    options: { body?: unknown; query?: QueryParams } = {},
  ): Promise<T> {
    const headers = new Headers({
      Accept: 'application/json',
      'x-service-api-key': this.serviceApiKey,
    })

    let body: BodyInit | undefined
    if (options.body instanceof FormData) {
      body = options.body
    } else if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json')
      body = JSON.stringify(options.body)
    }

    const controller = this.timeoutMs ? new AbortController() : undefined
    const timeout =
      controller && this.timeoutMs
        ? setTimeout(() => controller.abort(), this.timeoutMs)
        : undefined

    try {
      const response = await this.fetchImpl(buildUrl(this.baseUrl, path, options.query), {
        method,
        headers,
        body,
        signal: controller?.signal,
      })

      const payload = await parseResponseBody(response)
      if (!response.ok) {
        throw buildError(response, payload)
      }

      return payload as T
    } finally {
      if (timeout) clearTimeout(timeout)
    }
  }
}

export function createSohojxPayClient(options: ClientOptions) {
  return new SohojxPayClient(options)
}
