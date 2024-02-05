import { PrismaClient } from "@prisma/client";
import { db } from "src/database"
import { alpha_payment_service } from "src/helper"
const {execSync} = require('child_process');

const CHECK_TIME_INTERVAL = 2*1000

function process_unpayed_orders(db_connection: PrismaClient){
    let target_date = new Date(new Date().getTime()-15*60*1000)
    let order_status;
    db_connection.checkout.findMany({
        where:{
            status:"pending",
            paymentType: "online",
            orderDate:{
                lte: target_date
            }
        }
    }).then(async (checkouts)=>{
        for(let checkout of checkouts){
            order_status = await alpha_payment_service.get_payment_status(checkout.orderId)
            if (order_status.data.orderStatus == 6){
                console.log(`order ${checkout.orderId} payment is failed`);    
                await db_connection.checkout.delete({
                    where: {id: checkout.id},
                })
            }
            if(order_status.data.orderStatus==2){
                checkout = await db_connection.checkout.update({
                    where:{
                        id:checkout.id
                    },
                    data:{
                        status:"completed"
                    },
                })
            }
            execSync('sleep 1')
        }
        setTimeout(()=>{
            process_unpayed_orders(db_connection)
        }, CHECK_TIME_INTERVAL)
    })
    
}
async function main(){
    let db_connection = db()
    process_unpayed_orders(db_connection)
}

main()