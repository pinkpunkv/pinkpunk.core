import {config} from '../config'
import axios from 'axios';
import Decimal from 'decimal.js';

const alpha_payment_service = {
    create_payment: async function create_payment(orderId:string,amount:Decimal,ct:string) {
        let url = `${config.PAYMENT_URL}rest/register.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${orderId}&amount=${amount.toFixed(0)}&returnUrl=${config.WEBSITES.BY}/success?ct=${ct}&orderId=${orderId}&failUrl=${config.WEBSITES.BY}/fail?ct=${ct}&orderId=${orderId}`
        return await axios.post(url)
    },

    // create_payment_google: async function create_payment_google(orderId:string,amount:Decimal,ct:string) {
    //     return await axios.post(`${config.PAYMENT_URL}google/payment.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${orderId}&amount=${amount.toFixed(0)}&returnUrl=${config.WEBSITES.BY}/success?ct=${ct}&orderId=${orderId}&failUrl=${config.WEBSITES.BY}/fail?ct=${ct}&orderId=${orderId}`)
    // },
    get_payment_status: async function get_payment_status(orderNumber:string) {
        let url = `${config.PAYMENT_URL}rest/getOrderStatusExtended.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${orderNumber}`;
        return await axios.post(url)
    }
}
export {alpha_payment_service}