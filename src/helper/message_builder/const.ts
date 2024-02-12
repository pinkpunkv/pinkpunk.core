import { EMAILS_FROM_INFO_BY, EMAILS_FROM_SUPPORT_BY, SITEURL_BY } from "./env"

const MESSAGES = {
    CONFIRM:{
        BY:"Подтвердите ваш Email адрес",
        EN:"Confirm your email address"
    },
    FORGOT:{
        BY:"Восстановление пароля",
        EN:"Password recovery"
    },
    ORDER:{
        BY:(orderNumber:number)=>{return `Вaш заказ № ${orderNumber} успешно оформлен`},
        EN:(orderNumber:number)=>{return `Your order № ${orderNumber} has been placed`}
    }
}
const EMAIL_INFO_LOGIN = process.env.EMAIL_INFO_LOGIN
const EMAILS_FROM = {
        BY:{
            INFO:EMAILS_FROM_INFO_BY,
            SUPPORT:EMAILS_FROM_SUPPORT_BY
        }
    }
    
const SITES = {
    BY:SITEURL_BY
}

export {MESSAGES, SITES, EMAIL_INFO_LOGIN, EMAILS_FROM}