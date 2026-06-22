import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SohojxPayApiError, createSohojxPayClient } from '../dist/index.js'

const BASE_URL = 'https://tenant.sohojx.com'
const SERVICE_API_KEY = 'sk_test_123'

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  })
}

function createRecordingClient(response = { success: true }) {
  const requests = []
  const client = createSohojxPayClient({
    baseUrl: `${BASE_URL}/`,
    serviceApiKey: SERVICE_API_KEY,
    fetch: async (url, init = {}) => {
      requests.push({ url: String(url), init })
      return jsonResponse(response, { status: 201 })
    },
  })

  return { client, requests }
}

function getJsonBody(request) {
  assert.equal(typeof request.init.body, 'string')
  return JSON.parse(request.init.body)
}

function assertCommonHeaders(request) {
  assert.equal(request.init.headers.get('accept'), 'application/json')
  assert.equal(request.init.headers.get('x-service-api-key'), SERVICE_API_KEY)
}

describe('client setup', () => {
  it('requires a baseUrl', () => {
    assert.throws(
      () => createSohojxPayClient({ baseUrl: '', serviceApiKey: SERVICE_API_KEY }),
      /requires baseUrl/,
    )
  })

  it('requires a serviceApiKey', () => {
    assert.throws(
      () => createSohojxPayClient({ baseUrl: BASE_URL, serviceApiKey: '' }),
      /requires serviceApiKey/,
    )
  })

  it('normalizes trailing slashes from the base URL', async () => {
    const { client, requests } = createRecordingClient({ success: true, data: {} })

    await client.recharge.getBalance()

    assert.equal(requests[0].url, `${BASE_URL}/api/v1/recharge/balance`)
  })
})

describe('service endpoints', () => {
  const endpointCases = [
    {
      name: 'recharge.getBalance',
      call: (client) => client.recharge.getBalance(),
      method: 'GET',
      url: `${BASE_URL}/api/v1/recharge/balance`,
    },
    {
      name: 'recharge.getDetails',
      call: (client) => client.recharge.getDetails({ tranId: 'RCH 100/1' }),
      method: 'GET',
      url: `${BASE_URL}/api/v1/recharge/details?tran_id=RCH+100%2F1`,
    },
    {
      name: 'bills.list',
      call: (client) => client.bills.list({ page: 2, per_page: 50, startDate: undefined, endDate: '' }),
      method: 'GET',
      url: `${BASE_URL}/api/v1/bills?page=2&per_page=50`,
    },
    {
      name: 'bills.get',
      call: (client) => client.bills.get('bill/id 1'),
      method: 'GET',
      url: `${BASE_URL}/api/v1/bills/bill%2Fid%201`,
    },
    {
      name: 'mfs.list',
      call: (client) => client.mfs.list({ page: 3, per_page: 25 }),
      method: 'GET',
      url: `${BASE_URL}/api/v1/mfs?page=3&per_page=25`,
    },
    {
      name: 'mfs.get',
      call: (client) => client.mfs.get('mfs/id 1'),
      method: 'GET',
      url: `${BASE_URL}/api/v1/mfs/mfs%2Fid%201`,
    },
  ]

  for (const testCase of endpointCases) {
    it(`calls ${testCase.name}`, async () => {
      const { client, requests } = createRecordingClient({ success: true, data: {}, meta: {} })

      await testCase.call(client)

      assert.equal(requests.length, 1)
      assert.equal(requests[0].url, testCase.url)
      assert.equal(requests[0].init.method, testCase.method)
      assert.equal(requests[0].init.headers.get('content-type'), null)
      assert.equal(requests[0].init.body, undefined)
      assertCommonHeaders(requests[0])
    })
  }
})

describe('JSON request bodies', () => {
  const bodyCases = [
    {
      name: 'recharge.submit',
      call: (client, payload) => client.recharge.submit(payload),
      url: `${BASE_URL}/api/v1/recharge/request`,
      payload: {
        number: '01712345678',
        operator: 'GP',
        type: 'prepaid',
        amount: 100,
        tran_id: 'RCH-1',
      },
    },
    {
      name: 'bills.create',
      call: (client, payload) => client.bills.create(payload),
      url: `${BASE_URL}/api/v1/bills`,
      payload: {
        bill_type: 'electricity',
        biller_code: 'desco',
        meter_type: 'prepaid',
        account_number: '123456789',
        contact_number: '01712345678',
        amount: 500,
        tran_id: 'BILL-1',
      },
    },
    {
      name: 'mfs.create',
      call: (client, payload) => client.mfs.create(payload),
      url: `${BASE_URL}/api/v1/mfs`,
      payload: {
        mfs_name: 'bkash',
        mfs_type: 'send_money',
        receiver_no: '01712345678',
        amount: 200,
        tran_id: 'MFS-1',
      },
    },
  ]

  for (const testCase of bodyCases) {
    it(`sends ${testCase.name} as JSON`, async () => {
      const { client, requests } = createRecordingClient({ success: true, status: 'SUCCESS' })

      await testCase.call(client, testCase.payload)

      assert.equal(requests[0].url, testCase.url)
      assert.equal(requests[0].init.method, 'POST')
      assert.equal(requests[0].init.headers.get('content-type'), 'application/json')
      assert.deepEqual(getJsonBody(requests[0]), {
        ...testCase.payload,
        amount: String(testCase.payload.amount),
      })
      assertCommonHeaders(requests[0])
    })
  }

  it('preserves string amounts as provided', async () => {
    const { client, requests } = createRecordingClient({ success: true, status: 'SUCCESS' })

    await client.recharge.submit({
      number: '01712345678',
      operator: 'GP',
      type: 'prepaid',
      amount: '20.50',
      tran_id: 'RCH-STRING-AMOUNT',
    })

    assert.equal(getJsonBody(requests[0]).amount, '20.50')
  })
})

describe('bulk CSV requests', () => {
  const bulkCases = [
    {
      name: 'recharge.bulk',
      call: (client, csv, options) => client.recharge.bulk(csv, options),
      url: `${BASE_URL}/api/v1/recharge/bulk`,
      filename: 'recharge-bulk.csv',
      csv: 'number,operator,type,amount,tran_id\n01712345678,GP,prepaid,100,RCH-1',
    },
    {
      name: 'bills.bulk',
      call: (client, csv, options) => client.bills.bulk(csv, options),
      url: `${BASE_URL}/api/v1/bills/bulk`,
      filename: 'bills-bulk.csv',
      csv: 'bill_type,biller_code,meter_type,account_number,contact_number,bill_number,amount,note,tran_id\nelectricity,desco,prepaid,123456789,01712345678,,500,,BILL-1',
    },
    {
      name: 'mfs.bulk',
      call: (client, csv, options) => client.mfs.bulk(csv, options),
      url: `${BASE_URL}/api/v1/mfs/bulk`,
      filename: 'mfs-bulk.csv',
      csv: 'mfs_name,mfs_type,receiver_no,amount,tran_id\nbkash,send_money,01712345678,100,MFS-1',
    },
  ]

  for (const testCase of bulkCases) {
    it(`sends ${testCase.name} as multipart file upload`, async () => {
      const { client, requests } = createRecordingClient({
        success: true,
        status: 'SUCCESS',
        data: { service: 'bulk', total_rows: 1, successful: 1, failed: 0, results: [] },
      })

      await testCase.call(client, testCase.csv)

      assert.equal(requests[0].url, testCase.url)
      assert.equal(requests[0].init.method, 'POST')
      assert.equal(requests[0].init.headers.get('content-type'), null)
      assert.equal(requests[0].init.body instanceof FormData, true)
      assertCommonHeaders(requests[0])

      const file = requests[0].init.body.get('file')
      assert.equal(file.name, testCase.filename)
      assert.equal(file.type, 'text/csv')
      assert.equal(await file.text(), testCase.csv)
    })
  }

  it('allows custom bulk filenames', async () => {
    const { client, requests } = createRecordingClient({ success: true })

    await client.recharge.bulk('number,operator,type,amount,tran_id\n01712345678,GP,prepaid,100,RCH-1', {
      filename: 'custom-recharge.csv',
    })

    assert.equal(requests[0].init.body.get('file').name, 'custom-recharge.csv')
  })

  it('passes through caller-provided FormData unchanged', async () => {
    const formData = new FormData()
    formData.append('file', new Blob(['already-built'], { type: 'text/csv' }), 'prebuilt.csv')
    formData.append('batch_id', 'batch-1')
    const { client, requests } = createRecordingClient({ success: true })

    await client.mfs.bulk(formData)

    assert.equal(requests[0].init.body, formData)
    assert.equal(await requests[0].init.body.get('file').text(), 'already-built')
    assert.equal(requests[0].init.body.get('batch_id'), 'batch-1')
  })
})

describe('responses and errors', () => {
  it('returns parsed JSON payloads', async () => {
    const expected = {
      success: true,
      data: {
        currentBalance: '100.00',
        totalAmountProcessed: '500.00',
        totalTransactions: 5,
        successfulTransactions: 4,
        failedTransactions: 1,
        lastTransactionAt: null,
      },
    }
    const client = createSohojxPayClient({
      baseUrl: BASE_URL,
      serviceApiKey: SERVICE_API_KEY,
      fetch: async () => jsonResponse(expected),
    })

    assert.deepEqual(await client.recharge.getBalance(), expected)
  })

  it('throws typed API errors with JSON status codes', async () => {
    const payload = { success: false, status: 'ERROR', message: 'Invalid mobile number' }
    const client = createSohojxPayClient({
      baseUrl: BASE_URL,
      serviceApiKey: SERVICE_API_KEY,
      fetch: async () => jsonResponse(payload, { status: 400 }),
    })

    await assert.rejects(
      () => client.recharge.getDetails({ tranId: 'RCH-404' }),
      (error) => {
        assert.equal(error instanceof SohojxPayApiError, true)
        assert.equal(error.status, 400)
        assert.equal(error.code, 'ERROR')
        assert.equal(error.message, 'Invalid mobile number')
        assert.deepEqual(error.payload, payload)
        return true
      },
    )
  })

  it('uses error field when message is absent', async () => {
    const client = createSohojxPayClient({
      baseUrl: BASE_URL,
      serviceApiKey: SERVICE_API_KEY,
      fetch: async () => jsonResponse({ error: 'Rate limit exceeded' }, { status: 429 }),
    })

    await assert.rejects(
      () => client.recharge.getBalance(),
      (error) => {
        assert.equal(error.message, 'Rate limit exceeded')
        assert.equal(error.status, 429)
        return true
      },
    )
  })

  it('uses plain text response bodies as error messages', async () => {
    const client = createSohojxPayClient({
      baseUrl: BASE_URL,
      serviceApiKey: SERVICE_API_KEY,
      fetch: async () => new Response('Gateway unavailable', { status: 503 }),
    })

    await assert.rejects(
      () => client.recharge.getBalance(),
      (error) => {
        assert.equal(error.message, 'Gateway unavailable')
        assert.equal(error.status, 503)
        return true
      },
    )
  })

  it('falls back to HTTP status when response body has no message', async () => {
    const client = createSohojxPayClient({
      baseUrl: BASE_URL,
      serviceApiKey: SERVICE_API_KEY,
      fetch: async () => new Response('', { status: 502 }),
    })

    await assert.rejects(
      () => client.recharge.getBalance(),
      (error) => {
        assert.equal(error.message, 'SohojxPay API request failed with HTTP 502')
        assert.equal(error.status, 502)
        return true
      },
    )
  })
})

describe('custom fetch behavior', () => {
  it('passes an AbortSignal when timeoutMs is configured', async () => {
    let capturedSignal
    const client = createSohojxPayClient({
      baseUrl: BASE_URL,
      serviceApiKey: SERVICE_API_KEY,
      timeoutMs: 1000,
      fetch: async (_url, init) => {
        capturedSignal = init.signal
        return jsonResponse({ success: true })
      },
    })

    await client.recharge.getBalance()

    assert.equal(capturedSignal instanceof AbortSignal, true)
    assert.equal(capturedSignal.aborted, false)
  })

  it('lets custom fetch rejections surface to callers', async () => {
    const networkError = new Error('Network connection failed')
    const client = createSohojxPayClient({
      baseUrl: BASE_URL,
      serviceApiKey: SERVICE_API_KEY,
      fetch: async () => {
        throw networkError
      },
    })

    await assert.rejects(() => client.recharge.getBalance(), networkError)
  })
})
