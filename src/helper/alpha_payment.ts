import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import {config} from '../config'
import axios, { AxiosResponse } from 'axios';

class DepositItem{
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

async function payForOrder(orderId:string,amount,ct) {
    let url = `${config.PAYMENT_URL}rest/register.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${orderId}&amount=${amount}&returnUrl=${config.WEBSITES.BY}/success?ct=${ct}&orderId=${orderId}&failUrl=${config.WEBSITES.BY}/fail?ct=${ct}&orderId=${orderId}`
    return await axios.post(url)
}

async function payForOrderGoogle(orderId:string,amount,ct) {
    return await axios.post(`${config.PAYMENT_URL}google/payment.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${orderId}&amount=${amount}&returnUrl=${config.WEBSITES.BY}/success?ct=${ct}&orderId=${orderId}&failUrl=${config.WEBSITES.BY}/fail?ct=${ct}&orderId=${orderId}`)
}
async function getOrderStatus(orderNumber:string) {
    let url = `${config.PAYMENT_URL}rest/getOrderStatusExtended.do?userName=${config.PAYMENT_LOGIN}&password=${config.PAYMENT_PASSWORD}&orderNumber=${orderNumber}`;
    return await axios.post(url)
}

export default Object.freeze({
    payForOrder,
    getOrderStatus
})