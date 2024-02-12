import sgMail,{MailDataRequired} from '@sendgrid/mail';
import {config} from '../config'
const { createTransport } = require('nodemailer');

//sgMail.setApiKey(config.SENDGRID_API_KEY as string);

export default async function sendMessage(message:MailDataRequired){

    const transporter = createTransport({
        host: config.SMTP_SERVER,
        port: 587,
        auth: {
            user: config.EMAIL_INFO_LOGIN,
            pass: config.SMTP_PASSWORD,
        },
    });
    return await transporter.sendMail(message)
    //return await sgMail.send(message)

}
