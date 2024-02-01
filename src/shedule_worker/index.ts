import { db } from "src/database"

const CHECK_TIME_INTERVAL = 2*1000

async function main(){
    let conn = db()
    setInterval(()=>{
        let now = new Date(new Date().getTime()-15*60*1000)
        conn.checkout.findMany({
            where:{
                status:"pending",
                paymentType: "online",
                orderDate:{
                    lte: now
                }
            }
        }).then((checkouts)=>{
            for(let checkout of checkouts){
                checkout.orderDate
            }
        })
    }, CHECK_TIME_INTERVAL)
}

main()