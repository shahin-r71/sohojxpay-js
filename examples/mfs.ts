import { createSohojxPayClient } from '@sohojxpay/sdk'

const sohojxpay = createSohojxPayClient({
  baseUrl: process.env.SOHOJXPAY_BASE_URL!,
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
})

const transaction = await sohojxpay.mfs.create({
  mfs_name: 'bkash',
  mfs_type: 'send_money',
  receiver_no: '01712345678',
  amount: 200,
  tran_id: `MFS-${Date.now()}`,
})

console.log(transaction)
