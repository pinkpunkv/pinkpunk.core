import * as amqp from 'amqplib';
import {config} from '../config'
let channel:amqp.Channel;
export default async function createRabbitMQConnection(){
  if (!channel){
    let connection = await amqp.connect(config.rabbitMQURL);
    channel = await connection.createChannel();
  }
  return Object.freeze({
    sendMessage
  });
  
  async function sendMessage(queue:string,message:string) {
    let que = await channel.assertQueue(queue,{
      durable: false
    });
    channel.sendToQueue(que.queue, Buffer.from(message));
  }
}