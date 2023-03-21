import * as amqp from 'amqplib';
import {config} from '../config'


export const sendMessage = async (queue:String,message:String)=> {
    const connection = await amqp.connect(config.rabbitMQURL);
    const channel = await connection.createChannel();
  
    await channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(message));
  
    console.log(`Sent message: ${message}`);
  
    connection.close();
}