import * as amqp from 'amqplib';
import {config} from '../config'
import { CheckoutMessage } from 'src/abstract/types';
let channel:amqp.Channel;
let QUEUE = "user"
export default async function create_message_broker_connection(){
  if (!channel){
    let connection = await amqp.connect(config.rabbitMQURL!);
    channel = await connection.createChannel();
  }
  return Object.freeze({
    publish_order_info,
    publish_user_action
  });
  
  async function publish_order_info(type:string, email:string,confirm_token:string, lang: string, message:CheckoutMessage) {
    let que = await channel.assertQueue(QUEUE,{
      durable: false
    });
    channel.sendToQueue(que.queue, Buffer.from(JSON.stringify({type:"order",email:email,ct:confirm_token, lang:lang, checkoutInfo:message})));
  }

  async function publish_user_action(type:string, email:string, lang: string, confirm_token:string) {
    let que = await channel.assertQueue(QUEUE,{
      durable: false
    });
    channel.sendToQueue(que.queue, Buffer.from(JSON.stringify({type:type, email:email, lang:lang, ct:confirm_token})));
  }
}