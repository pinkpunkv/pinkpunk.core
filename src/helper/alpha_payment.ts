import {config} from '../config'
import axios, { AxiosResponse } from 'axios';
import Decimal from 'decimal.js';

interface DepositItem{
    positionId:number
    name:string
    quantity:{
        value:number
        measure:"шт"
    }
    itemCode:number
    itemAmount:number
    itemPrice:number
    tax:{taxType:0}
}

async function pay_for_order(orderId:string,amount:Decimal,ct:string) {
    let url = `${config.PAYMENT_URL}rest/register.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${orderId}&amount=${amount}&returnUrl=${config.WEBSITES.BY}/success?ct=${ct}&orderId=${orderId}&failUrl=${config.WEBSITES.BY}/fail?ct=${ct}&orderId=${orderId}`
    return await axios.post(url)
}

async function pay_for_orderGoogle(orderId:string,amount:Decimal,ct:string) {
    return await axios.post(`${config.PAYMENT_URL}google/payment.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${orderId}&amount=${amount}&returnUrl=${config.WEBSITES.BY}/success?ct=${ct}&orderId=${orderId}&failUrl=${config.WEBSITES.BY}/fail?ct=${ct}&orderId=${orderId}`)
}
async function get_order_status(orderNumber:string) {
    let url = `${config.PAYMENT_URL}rest/get_order_statusExtended.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${orderNumber}`;
    return await axios.post(url)
}

export default Object.freeze({
    pay_for_order,
    get_order_status
})