import dotenv from 'dotenv'
dotenv.config()

export class ENV{
    static get(name:string):string{
        if(!process.env[name])
            throw new Error(`${name} variable is not set`);
        return process.env[name]!
    }
}