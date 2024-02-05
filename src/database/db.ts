import { PrismaClient } from "@prisma/client";
import { createSoftDeleteMiddleware } from "prisma-soft-delete-middleware";

let conection:PrismaClient|null;
const SOFT_DELETION_MODELS = []
export function db() : PrismaClient{
    if(conection){
        return conection;
    }
    
    conection = new PrismaClient({
        // log: [
        //     {
        //       emit: 'stdout',
        //       level: 'query',
        //     },
        //     {
        //       emit: 'stdout',
        //       level: 'error',
        //     },
        //     {
        //       emit: 'stdout',
        //       level: 'info',
        //     },
        //     {
        //       emit: 'stdout',
        //       level: 'warn',
        //     },
        //   ],
    });
    conection.$connect().then((conn)=>{
        console.log("database connected");
    }).catch((err)=>{
        throw err;
    })
    conection.$use(
        createSoftDeleteMiddleware({
            models:{
                Variant: true,
                Product: true,
                Checkout: true
            },
        })
    )
    return conection
}