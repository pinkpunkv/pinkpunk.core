import { PrismaClient } from "@prisma/client";

let conection:PrismaClient;

export default function db(){
    if(conection){
        console.log("sasi");
        return conection;
    }
    
    conection = new PrismaClient();
    
    conection.$connect().then(()=>{
        console.log("database connected");
    }).catch((err)=>{
        throw err;
    })
    return conection
}