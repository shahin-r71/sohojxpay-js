import { SohojxPayApiError, createSohojxPayClient } from '@sohojxpay/sdk'

const sohojxpay = createSohojxPayClient({
  baseUrl: process.env.SOHOJXPAY_BASE_URL!,
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
})

try {
  await sohojxpay.recharge.getDetails({ tranId: 'missing-tran-id' })
} catch (error) {
  if (error instanceof SohojxPayApiError) {
    console.error('Status:', error.status)
    console.error('Code:', error.code)
    console.error('Message:', error.message)
    console.error('Payload:', error.payload)
  } else {
    throw error
  }
}
