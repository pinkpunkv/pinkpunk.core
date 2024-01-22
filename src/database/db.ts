import { PrismaClient } from "@prisma/client";

let conection:PrismaClient|null;

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
    conection.$connect().then(()=>{
        console.log("database connected");
    }).catch((err)=>{
        throw err;
    })
    return conection
}