export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export interface ClientOptions {
  baseUrl: string
  serviceApiKey: string
  fetch?: FetchLike
  timeoutMs?: number
}

export type ApiStatus = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'ERROR' | string
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | string

export interface ApiErrorPayload {
  success?: false
  status?: ApiStatus
  code?: string
  message?: string
  error?: string
  [key: string]: unknown
}

export interface Location {
  lat: number
  lng: number
}

export interface PaginatedMeta {
  total: number
  page: number
  totalPages?: number
  total_pages?: number
  perPage?: number
  per_page?: number
  limit?: number
  has_more?: boolean
  [key: string]: unknown
}

export interface ListParams {
  page?: number
  per_page?: number
  startDate?: string
  endDate?: string
}

export type BulkCsvInput = string | Blob | FormData

export interface BulkCsvOptions {
  filename?: string
}

export interface BulkRowResult {
  row: number
  success: boolean
  status: ApiStatus
  message: string
  tran_id?: string
  [key: string]: unknown
}

export interface BulkProcessSummary {
  success: boolean
  status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'ERROR'
  message: string
  data: {
    service: 'recharge' | 'bills' | 'mfs'
    total_rows: number
    successful: number
    failed: number
    results: BulkRowResult[]
  }
}

export type RechargeType = 'prepaid' | 'postpaid' | 'skitto'

export interface RechargeSubmitPayload {
  number: string
  operator: string
  type: RechargeType
  amount: string | number
  tran_id: string
  recharge_processor?: 'system' | 'flexibd'
  package_id?: string
  package_name?: string
  source?: string
  location?: Location
}

export interface RechargeTransaction {
  id?: string
  tran_id?: string
  number?: string
  operator?: string
  type?: RechargeType | string
  amount?: string
  status?: TransactionStatus
  status_message?: string | null
  queued_at?: string | null
  processing_at?: string | null
  completed_at?: string | null
  failed_at?: string | null
  created_at?: string
  [key: string]: unknown
}

export interface RechargeSubmitResponse {
  success: boolean
  status: ApiStatus
  message: string
  data?: RechargeTransaction
  [key: string]: unknown
}

export interface RechargeDetailsParams {
  tranId: string
}

export interface RechargeDetailsResponse {
  success: boolean
  status?: ApiStatus
  message?: string
  data?: RechargeTransaction
  [key: string]: unknown
}

export interface RechargeBalanceResponse {
  success: boolean
  data: {
    currentBalance: string
    totalAmountProcessed: string
    totalTransactions: number
    successfulTransactions: number
    failedTransactions: number
    lastTransactionAt: string | null
  }
}

export type BillType = 'electricity' | 'gas' | 'water'

export interface BillCreatePayload {
  bill_type: BillType
  biller_code: string
  account_number: string
  amount: string | number
  tran_id: string
  meter_type?: 'prepaid' | 'postpaid'
  contact_number?: string
  bill_number?: string
  note?: string
  location?: Location
}

export interface BillPayment {
  id?: string
  tran_id?: string
  tranId?: string
  bill_type?: BillType | string
  billType?: BillType | string
  biller_code?: string
  billerCode?: string
  biller_name?: string
  billerName?: string
  meter_type?: string | null
  meterType?: string | null
  account_number?: string
  accountNumber?: string
  contact_number?: string | null
  contactNumber?: string | null
  bill_number?: string | null
  billNumber?: string | null
  amount?: string
  status?: TransactionStatus
  status_message?: string | null
  queued_at?: string | null
  processing_at?: string | null
  completed_at?: string | null
  failed_at?: string | null
  created_at?: string
  [key: string]: unknown
}

export type BillListParams = ListParams

export interface BillListResponse {
  status: boolean
  message: string
  data: BillPayment[]
  meta: PaginatedMeta
}

export interface BillDetailResponse {
  status: boolean
  message: string
  data: BillPayment
}

export type MfsName = 'bkash' | 'nagad' | 'rocket' | 'upay' | string
export type MfsType = 'send_money' | 'cash_out' | 'cash_in' | 'payment' | string

export interface MfsCreatePayload {
  mfs_name: MfsName
  mfs_type: MfsType
  receiver_no: string
  amount: string | number
  tran_id?: string
  location?: Location
}

export interface MfsTransaction {
  id?: string
  tran_id?: string
  mfs_name?: MfsName
  mfs_type?: MfsType
  receiver_no?: string
  amount?: string
  location?: Location | null
  status?: TransactionStatus
  status_message?: string | null
  queued_at?: string | null
  processing_at?: string | null
  completed_at?: string | null
  failed_at?: string | null
  created_at?: string
  [key: string]: unknown
}

export type MfsListParams = ListParams

export interface MfsListResponse {
  status: boolean
  message: string
  data: MfsTransaction[]
  meta: PaginatedMeta
}

export interface MfsDetailResponse {
  status: boolean
  message: string
  data: MfsTransaction
}
