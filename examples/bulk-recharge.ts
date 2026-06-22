import { createSohojxPayClient } from 'sohojxpay-sdk'

const sohojxpay = createSohojxPayClient({
  baseUrl: process.env.SOHOJXPAY_BASE_URL!,
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
})

const csv = `number,operator,type,amount,tran_id
01712345678,GP,prepaid,100,RCH-BULK-001
01812345678,RB,prepaid,50,RCH-BULK-002`

const result = await sohojxpay.recharge.bulk(csv)
console.log(result)
