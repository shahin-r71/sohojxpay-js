import { createSohojxPayClient } from '@sohojxpay/sdk'

const sohojxpay = createSohojxPayClient({
  baseUrl: process.env.SOHOJXPAY_BASE_URL!,
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
})

const csv = `mfs_name,mfs_type,receiver_no,amount,tran_id
bkash,send_money,01712345678,200,MFS-BULK-001
nagad,cash_out,01812345678,150,MFS-BULK-002`

const result = await sohojxpay.mfs.bulk(csv)
console.log(result)
