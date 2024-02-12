import * as amqp from 'amqplib';
import { MESSAGE_BROKER_LISTENER__DSN } from './env';
import { make_message_builder_service } from 'src/helper/message_builder/messages_builder';
import sendTelegramMessage from 'src/helper/telegram_bot/telegram';

async function receive() {
    const connection = await amqp.connect(MESSAGE_BROKER_LISTENER__DSN);
    const channel = await connection.createChannel();
    const message_builder_service = make_message_builder_service()
    const queueName = 'user';

    await channel.assertQueue(queueName, { durable: false });
    console.log(`Waiting for messages in ${queueName}. To exit press CTRL+C`);

    channel.consume(queueName, async(msg: amqp.ConsumeMessage | null) => {
        if (msg !== null) {
            let mess = JSON.parse(msg.content.toString())
            console.log(mess);

            switch (mess.type) {
                case "confirm":
                    await message_builder_service.sendConfirm(mess.email,mess.ct,mess.lang)
                    break;
                case "order":
                    console.log("New Order")
                    await message_builder_service.sendOrderInfo(mess.email,mess.ct,mess.checkoutInfo,mess.lang)
                    await sendTelegramMessage(316885989, `New order: ${mess.checkoutInfo.orderId}`)
                    //await sendTelegramMessage(-970654090, `New order: ${mess.checkoutInfo.orderId}`)
                    break;
                case "forgot":
                    await message_builder_service.sendForgotPassword(mess.email,mess.ct,mess.lang)
                    break;
                default:
                    break;
            }
            channel.ack(msg);
        }
    }, { noAck: false });
}

receive();
