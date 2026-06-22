import { createSohojxPayClient } from 'sohojxpay-sdk'

const sohojxpay = createSohojxPayClient({
  baseUrl: process.env.SOHOJXPAY_BASE_URL!,
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
})

const balance = await sohojxpay.recharge.getBalance()
console.log('Current balance:', balance.data.currentBalance)

const recharge = await sohojxpay.recharge.submit({
  number: '01712345678',
  operator: 'GP',
  type: 'prepaid',
  amount: 100,
  tran_id: `RCH-${Date.now()}`,
})

console.log(recharge)
