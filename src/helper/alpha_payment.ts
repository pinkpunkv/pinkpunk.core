import {config} from '../config'
import axios from 'axios';
import Decimal from 'decimal.js';

const alpha_payment_service = {
    create_payment: async function create_payment(order_id:number, payment_order_id: number, amount:Decimal,ct:string) {
        let url = `${config.PAYMENT_URL}rest/register.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${payment_order_id}&amount=${amount.toFixed(0)}&returnUrl=${config.WEBSITES.BY}/success?ct=${ct}&orderId=${order_id}&failUrl=${config.WEBSITES.BY}/fail?ct=${ct}&orderId=${order_id}`
        return await axios.post(url)
    },

    // create_payment_google: async function create_payment_google(orderId:string,amount:Decimal,ct:string) {
    //     return await axios.post(`${config.PAYMENT_URL}google/payment.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${orderId}&amount=${amount.toFixed(0)}&returnUrl=${config.WEBSITES.BY}/success?ct=${ct}&orderId=${orderId}&failUrl=${config.WEBSITES.BY}/fail?ct=${ct}&orderId=${orderId}`)
    // },
    get_payment_status: async function get_payment_status(payment_order_id:number) {
        let url = `${config.PAYMENT_URL}rest/getOrderStatusExtended.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${payment_order_id}`;
        return await axios.post(url)
    },

    get_payment_status_url: function(payment_order_id:number){
        return `${config.PAYMENT_URL}rest/getOrderStatusExtended.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${payment_order_id}`;
    }
}
export {alpha_payment_service}