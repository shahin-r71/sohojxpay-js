# SohojxPay SDK

Official TypeScript SDK for SohojxPay service-key APIs: recharge, bill payment, and MFS.

This package is designed for trusted server-side integrations. It sends `x-service-api-key` automatically, exposes typed methods, supports bulk CSV upload helpers, and works in Node.js 18+ or any modern runtime with `fetch`.

> Keep service API keys on the server. Do not expose `SOHOJXPAY_SERVICE_API_KEY` in public browser bundles.

## Install

```bash
npm install @sohojxpay/sdk
```

```bash
pnpm add @sohojxpay/sdk
```

## Create Client

```ts
import { createSohojxPayClient } from '@sohojxpay/sdk'

const sohojxpay = createSohojxPayClient({
  baseUrl: 'https://your-sohojxpay-domain.com',
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
})
```

Every request includes:

```http
x-service-api-key: your_service_api_key
Accept: application/json
```

Client options:

- `baseUrl`: your SohojxPay site URL, for example `https://pay.example.com`. Do not include `/api/v1`; the SDK adds API paths itself.
- `serviceApiKey`: service API key created from the SohojxPay dashboard.
- `fetch`: optional custom fetch implementation. Use this for tests, older runtimes, proxies, logging, tracing, or retry wrappers.
- `timeoutMs`: optional request timeout in milliseconds. The SDK passes an `AbortSignal` to `fetch` when this is set.

### Custom Fetch

By default, the SDK uses `globalThis.fetch`. You can override it:

```ts
const sohojxpay = createSohojxPayClient({
  baseUrl: 'https://your-sohojxpay-domain.com',
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
  fetch: async (url, init) => {
    console.log('SohojxPay request:', init?.method, String(url))
    return fetch(url, init)
  },
})
```

This is also how tests can verify requests without calling the real server.

### Timeout

```ts
const sohojxpay = createSohojxPayClient({
  baseUrl: 'https://your-sohojxpay-domain.com',
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
  timeoutMs: 10_000,
})
```

When `timeoutMs` is set, the SDK creates an `AbortController` and passes its signal to `fetch`. If the request exceeds the timeout, the fetch implementation rejects with an abort error.

## Recharge

```ts
const balance = await sohojxpay.recharge.getBalance()
console.log(balance.data.currentBalance)
```

```ts
const recharge = await sohojxpay.recharge.submit({
  number: '01712345678',
  operator: 'GP',
  type: 'prepaid',
  amount: 100,
  tran_id: 'RCH-10001',
})
```

```ts
const details = await sohojxpay.recharge.getDetails({
  tranId: 'RCH-10001',
})
```

Recharge fields:

- `number`: Bangladeshi mobile number, 11 digits starting with `01`.
- `operator`: operator code such as `GP`, `BL`, `RB`, `AT`, `TT`, or `SK`.
- `type`: `prepaid`, `postpaid`, or `skitto`.
- `amount`: positive amount.
- `tran_id`: unique transaction ID, 5-50 characters.

## Bill Payments

```ts
const payments = await sohojxpay.bills.list({
  page: 1,
  per_page: 20,
})
```

```ts
const bill = await sohojxpay.bills.create({
  bill_type: 'electricity',
  biller_code: 'desco',
  meter_type: 'prepaid',
  account_number: '123456789',
  contact_number: '01712345678',
  amount: 500,
  tran_id: 'BILL-10001',
})
```

```ts
const billDetails = await sohojxpay.bills.get('bill-payment-id')
```

`bills.get(id)` expects the bill payment record `id` returned by bill create/list responses, not `tran_id`.

Bill fields:

- `bill_type`: `electricity`, `gas`, or `water`.
- `biller_code`: biller/provider code configured on your SohojxPay server.
- `meter_type`: required for electricity, `prepaid` or `postpaid`.
- `account_number`: customer account or meter number.
- `contact_number`: required for electricity.
- `amount`: positive amount.
- `tran_id`: unique transaction ID, 5-50 characters. Required for single bill creation. Bulk bill CSV rows may leave it empty and the server can generate one.

## MFS

```ts
const transactions = await sohojxpay.mfs.list({
  page: 1,
  per_page: 20,
})
```

```ts
const mfs = await sohojxpay.mfs.create({
  mfs_name: 'bkash',
  mfs_type: 'send_money',
  receiver_no: '01712345678',
  amount: 200,
  tran_id: 'MFS-10001',
})
```

```ts
const mfsDetails = await sohojxpay.mfs.get('mfs-transaction-id')
```

`mfs.get(id)` expects the MFS transaction record `id` returned by MFS create/list responses, not `tran_id`.

MFS fields:

- `mfs_name`: provider name such as `bkash`, `nagad`, `rocket`, or `upay`.
- `mfs_type`: transaction type configured on your SohojxPay server.
- `receiver_no`: Bangladeshi receiver number, 11 digits starting with `01`.
- `amount`: positive amount.
- `tran_id`: optional for single MFS creation; the server can generate one when missing.

## Bulk CSV Requests

Bulk methods send multipart form data with a `.csv` file in the `file` field. The SDK accepts CSV text, a `Blob`, or a prebuilt `FormData`.

### Bulk Recharge

Required CSV headers:

```csv
number,operator,type,amount,tran_id
```

```ts
const csv = `number,operator,type,amount,tran_id
01712345678,GP,prepaid,100,RCH-BULK-001
01812345678,RB,prepaid,50,RCH-BULK-002`

const result = await sohojxpay.recharge.bulk(csv)
```

### Bulk Bills

Required CSV headers:

```csv
bill_type,biller_code,meter_type,account_number,contact_number,bill_number,amount,note,tran_id
```

```ts
const csv = `bill_type,biller_code,meter_type,account_number,contact_number,bill_number,amount,note,tran_id
electricity,desco,prepaid,123456789,01712345678,,500,Office meter,BILL-BULK-001
gas,titas,,987654321,,,350,Monthly gas bill,BILL-BULK-002`

const result = await sohojxpay.bills.bulk(csv)
```

### Bulk MFS

Required CSV headers:

```csv
mfs_name,mfs_type,receiver_no,amount,tran_id
```

```ts
const csv = `mfs_name,mfs_type,receiver_no,amount,tran_id
bkash,send_money,01712345678,200,MFS-BULK-001
nagad,cash_out,01812345678,150,MFS-BULK-002`

const result = await sohojxpay.mfs.bulk(csv)
```

The server currently accepts up to 100 request rows per CSV file. Empty rows are ignored.

## IDs And Transaction IDs

The APIs use two different identifiers:

- `id`: internal record ID returned in create/list responses. Bill and MFS detail lookups use this value.
- `tran_id`: your external transaction ID. Recharge detail lookup uses this value.

For v1:

```ts
await sohojxpay.recharge.getDetails({ tranId: 'RCH-10001' })
await sohojxpay.bills.get('bill-payment-record-id')
await sohojxpay.mfs.get('mfs-transaction-record-id')
```

## Error Handling

The SDK throws `SohojxPayApiError` for non-2xx responses.

```ts
import { SohojxPayApiError } from '@sohojxpay/sdk'

try {
  await sohojxpay.recharge.getDetails({ tranId: 'missing-id' })
} catch (error) {
  if (error instanceof SohojxPayApiError) {
    console.error(error.status)
    console.error(error.code)
    console.error(error.message)
    console.error(error.payload)
  }
}
```

Common SDK/service-key statuses:

- `400`: invalid input, duplicate transaction, insufficient balance, or minimum balance issue.
- `401`: missing, invalid, revoked, expired, or unsupported authentication.
- `403`: valid service API key, but the key does not have the required service permission.
- `422`: request was understood but could not be processed.
- `429`: rate limit exceeded.
- `500`: server-side failure.

This SDK uses `x-service-api-key`. It does not use mobile app `x-api-key`/`x-device-id` auth or access-token refresh flows. If a mobile app refreshes tokens on `403`, keep that behavior scoped to the mobile/session API client, not this service-key SDK.

## Supported APIs

This SDK intentionally wraps only service-key integration routes:

- `GET /api/v1/recharge/balance`
- `POST /api/v1/recharge/request`
- `POST /api/v1/recharge/bulk`
- `GET /api/v1/recharge/details`
- `GET /api/v1/bills`
- `POST /api/v1/bills`
- `POST /api/v1/bills/bulk`
- `GET /api/v1/bills/{id}`
- `GET /api/v1/mfs`
- `POST /api/v1/mfs`
- `POST /api/v1/mfs/bulk`
- `GET /api/v1/mfs/{id}`

User-session routes such as offers, drive purchase, and dashboard user balance are not included in v1.

## Security For Integrators

Publishing this SDK publicly does not expose backend internals. This package contains only endpoint calls, request/response types, and examples.

The package must not contain:

- service API keys
- database credentials
- Prisma models or migrations
- backend controllers or private business logic
- admin endpoints
- internal pricing or entitlement code

The security boundary remains the SohojxPay server, which validates service API keys, permissions, KYC state, balance, request fields, rate limits, and audit history.

## Development

For contributors working on this SDK repo:

```bash
npm install
npm run check
npm pack --dry-run
```

`npm run check` builds TypeScript and runs the unit tests.

## More Examples

The npm package also includes `examples/` with standalone TypeScript examples for each service and bulk flow.

## License

MIT
