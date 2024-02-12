import {Telegraf} from 'telegraf'
import { TG_SECRET } from './env'

export default async function sendTelegramMessage(chat_id:number, message:string){
    let bot = new Telegraf(TG_SECRET)
    return await bot.telegram.sendMessage(chat_id, message)
}
