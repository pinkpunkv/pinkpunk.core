import axios from 'axios';
import Decimal from 'decimal.js';
import { PAYMENT_CALL_BACK_BASE_URL, PAYMENT_LOGIN, PAYMENT_PASSWORD, PAYMENT_URL } from './env';


const alpha_payment_service = {
    create_payment: async function create_payment(internal_order_id:number, payment_order_id: number, order_amount:Decimal,ct:string) {
        // let url = `${PAYMENT_URL}rest/register.do?userName=${PAYMENT_LOGIN}&password=${PAYMENT_PASSWORD}&orderNumber=${payment_order_id}&amount=${order_amount.toFixed(0)}&returnUrl=${PAYMENT_CALL_BACK_BASE_URL}/success?ct=${ct}&orderId=${internal_order_id}&failUrl=${PAYMENT_CALL_BACK_BASE_URL}/fail?ct=${ct}&orderId=${internal_order_id}`
        return await axios.post(`${PAYMENT_URL}rest/register.do?
            userName=${PAYMENT_LOGIN}&
            password=${PAYMENT_PASSWORD}&
            orderNumber=${payment_order_id}&
            amount=${order_amount}&
            returnUrl=${PAYMENT_CALL_BACK_BASE_URL}/success?ct=${ct}&orderId=${internal_order_id}&
            failUrl=${PAYMENT_CALL_BACK_BASE_URL}/fail?ct=${ct}&orderId=${internal_order_id}`
        )
    },

    get_payment_status: async function get_payment_status(payment_order_id:number) {
        // let url = `${PAYMENT_URL}rest/getOrderStatusExtended.do?userName=${PAYMENT_LOGIN}&password=${PAYMENT_PASSWORD}&orderNumber=${payment_order_id}`;
        return await axios.post(`
            ${PAYMENT_URL}rest/getOrderStatusExtended.do?
            userName=${PAYMENT_LOGIN}&
            password=${PAYMENT_PASSWORD}&
            orderNumber=${payment_order_id}
        `)
    },
}
export {alpha_payment_service}