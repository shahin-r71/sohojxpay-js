import { createSohojxPayClient } from 'sohojxpay-sdk'

const sohojxpay = createSohojxPayClient({
  baseUrl: process.env.SOHOJXPAY_BASE_URL!,
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
})

const csv = `bill_type,biller_code,meter_type,account_number,contact_number,bill_number,amount,note,tran_id
electricity,desco,prepaid,123456789,01712345678,,500,Office meter,BILL-BULK-001
gas,titas,,987654321,,,350,Monthly gas bill,BILL-BULK-002`

const result = await sohojxpay.bills.bulk(csv)
console.log(result)
