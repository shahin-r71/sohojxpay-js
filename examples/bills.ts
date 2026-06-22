import { createSohojxPayClient } from 'sohojxpay-sdk'

const sohojxpay = createSohojxPayClient({
  baseUrl: process.env.SOHOJXPAY_BASE_URL!,
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
})

const payment = await sohojxpay.bills.create({
  bill_type: 'electricity',
  biller_code: 'desco',
  meter_type: 'prepaid',
  account_number: '123456789',
  contact_number: '01712345678',
  amount: 500,
  tran_id: `BILL-${Date.now()}`,
})

console.log(payment)
