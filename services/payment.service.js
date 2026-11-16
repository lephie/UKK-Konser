import { config } from "dotenv"
import midtransClient from "midtrans-client"

const {serverKey, clientKey, isProduction } = config.midtrans;

// 2 api midtrasn : snap & core 
const snap = new midtransClient.Snap({isProduction, serverKey, clientKey}); 
const core = new midtransClient.Core({isProduction, serverKey, clientKey})

export const redirectUrl = (token) => 
    `${isProduction ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com'}/snap/v2/vtweb/${token} `;

export const mapTransactionState = ({transaction_status, fraud_status} = {}) => {
    switch (transaction_status) {
        case 'capture' : 
            if (fraud_status === 'challange') return 'pending';
            if (fraud_status === 'deny') return 'failed';
            return 'paid';
        case 'settlement':
            return 'paid';
        case 'pending' :
            return 'pending';
        case 'deny':
        case 'cancel':
        case 'failure':
            return 'failed';
        case 'expire':
            return 'expired';
        default:
            return 'ignore'
    }
}

export const createSnapTransaction = async ({paymentRef, order, user, items, expiryMinutes }) =>{
    const itemsDetails = items.map((i) => ({
        id: String(i.id),
        price: Math.round(i.price),
        quantity: i.quantity,
        name: String(i.name).slice(0, 50),
    }))

    const grossAmount = itemsDetails.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const parameter = {
        transaction_details: {
            order_id: paymentRef,
            gross_amount: grossAmount
        },
        items_details: itemsDetails,
        costumer_details: {
            first_name: user.name,
            email: user.email,
            phone: user.phone || undefined
        },
        expiry: {
            unit: 'minutes',
            duration: expiryMinutes
        }
    };
    const result = await snap.createTransaction(parameter);
    return {token: result.token, redirectUrl: result.redirect_url, grossAmount: grossAmount}
}

export const verifySignature = (body = {}) => {
    const {order_id, status_code, gross_amount, signature_key} = body;
    if(!order_id || !status_code || !gross_amount || !signature_key) return false;

    const expected = 
    crypto.createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${signature_key}`)
    .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature_key));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const getTransactionStatus = (paymentRef) => core.transaction.status(paymentRef);

export const cancelTransactions = (paymentRef) => core.transaction.cancel(paymentRef);

export default {
    mapTransactionState, redirectUrl, getTransactionStatus,
    verifySignature, cancelTransactions, createSnapTransaction
}