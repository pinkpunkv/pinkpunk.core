import * as amqp from 'amqplib';
import { MailDataRequired } from '@sendgrid/mail';
import sendMessage from './send_message';
import {load} from 'cheerio'
import fs from 'fs/promises'

import root from 'app-root-path';
import path from 'path';
import { EMAILS_FROM, MESSAGES, SITES } from './const';
import { CheckoutMessageDto } from '@abstract/types';

export function make_message_builder_service(){

  return Object.freeze({
    sendConfirm,
    sendOrderInfo,
    sendForgotPassword
  });

  async function sendConfirm(to:string,ct:string,lang:"BY"|"RU"="BY") {
    lang = "BY"
    let file = await fs.open(path.join(root.path, '/static/confirm'+lang+'.html'))
    let $ = load(await (await file.readFile()).toString());
    file.close()
    $('.base-button_mr_css_attr').attr("href",SITES[lang]+"/confirm?ct="+ct)
    let message:MailDataRequired = {
        from: `PinkPunk Brand <${EMAILS_FROM[lang].INFO}>`,
        to:to,
        subject:MESSAGES.CONFIRM[lang],
        html:$.html()
    }
    return await sendMessage(message)
  }

  async function sendForgotPassword(to:string,ct:string,lang:"BY"|"RU"="BY") {
    lang = "BY"
    let file = await fs.open(path.join(root.path,'/static/forgot_password'+lang+'.html'))
    let $ = load(await (await file.readFile()).toString());
    file.close()
    $('.base-button_mr_css_attr').attr("href",SITES[lang]+"/forgot?ct="+ct)
    $('#mes-email-warning').text(to)
    $('#mes-email').text(to)
    let message:MailDataRequired = {
        from: `PinkPunk Brand <${EMAILS_FROM[lang].INFO}>`,
        to:to,
        subject:MESSAGES.FORGOT[lang],
        html:$.html()
    }
    return await sendMessage(message)
  }

  async function sendOrderInfo(to:string,ct:string,checkoutInfo:CheckoutMessageDto,lang:"BY"|"RU"="BY") {
    lang = "BY"
    let file = await fs.open(path.join(root.path,'/static/order'+lang+'.html'))
    let $ = load(await (await file.readFile()).toString());
    file.close()
    $('.base-button_mr_css_attr').attr("href", SITES[lang]+"/order/"+checkoutInfo.orderId+"?ct="+ct)
    $('#totalProducts').text(checkoutInfo.productsCount.toString())
    $('#total').text(checkoutInfo.total + " BYN")
    $('#delivery').text(checkoutInfo.deliveryPrice + " BYN")
    $('#discount').text(checkoutInfo.discount + " BYN")
    $('#finalTotal').text(checkoutInfo.finalTotal + " BYN")
    $('#o_id').text(checkoutInfo.orderId.toString())
    $('#contactFL').text(checkoutInfo.info.contactFL)
    $('#phone').text(checkoutInfo.info.phone)
    $('#email').text(checkoutInfo.info.email)

    $('#addressFL').text(checkoutInfo.info.addressFL)
    $('#city').text(checkoutInfo.info.city)
    $('#address').text(checkoutInfo.info.address)
    $('#postalcode').text(checkoutInfo.info.postalCode)

    file = await fs.open(path.join(root.path,'/static/orderProductBody'+lang+'.html'))
    let $1 = load(await (await file.readFile()).toString());
    file.close()

    for(let product of checkoutInfo.products){

        $1('#name').text(product.name.fieldValue)
        $1('#size').text(product.size)
        $1('#color').text(product.color||"")
        if(product.basePrice > product.price){
            $1('#price').html(`<s>${product.basePrice}</s> <span style="color:#da574f">${product.price}</span>`)
        }
        else {
            $1('#price').html(`<span>${product.price}</span>`)
        }
        $1('#amount').text((Number(product.price) * product.count).toFixed(2).toString())
        $1('#count').text(product.count.toString())
        $('#products').append($1.html())
    }


    let message:MailDataRequired = {
        from: `PinkPunk Brand <${EMAILS_FROM[lang].INFO}>`,
        to:to,
        subject:MESSAGES.ORDER[lang](checkoutInfo.orderId),
        html:$.html()
    }
    return await sendMessage(message)
  }
}
