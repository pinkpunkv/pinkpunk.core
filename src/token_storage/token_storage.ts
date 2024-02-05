import {PRIMARY_TOKEN} from './env'
import axios from 'axios'
import { RENEW_TOKEN_URL } from './const';
import fs from 'fs'
import { TokenData } from '../abstract/types';
import axiosRetry from 'axios-retry';
import format from 'string-template';
import schedule from 'node-schedule'

axiosRetry(axios, {retries: 10})
const RENEW_DIFFERENCE_MILLS = 10_000 

export class TokenStorage {
    private static instance: TokenStorage;
    private token: TokenData | undefined
    private file_path: string

    constructor(file_path: string) {
        // this.token = null;
        this.file_path = file_path;
        this.renew_token = this.renew_token.bind(this)
        this.shedule_renew_token = this.shedule_renew_token.bind(this)
    }

    public static getInstance(file_path: string): TokenStorage {
        if (!TokenStorage.instance) {
            TokenStorage.instance = new TokenStorage(file_path);
            TokenStorage.instance.start().then(()=>{
                console.log("token storage connected")
            })
        }
        return TokenStorage.instance;
    }

    async start(): Promise<void>{
        this.token = this.load_token()
        let now = new Date().getTime()
        if (!this.token || this.token.expires_at - now < RENEW_DIFFERENCE_MILLS){
            this.token = await this.renew_token()
        }
        if (this.token)
        schedule.scheduleJob(new Date(this.token.expires_at - RENEW_DIFFERENCE_MILLS), this.shedule_renew_token)
    }

    private async shedule_renew_token(){
        this.token = await this.renew_token()
        if (this.token)
        schedule.scheduleJob(new Date(this.token.expires_at - RENEW_DIFFERENCE_MILLS), this.shedule_renew_token)
    }

    private load_token() : undefined | TokenData {
        if (fs.existsSync(this.file_path)) {
            return JSON.parse(fs.readFileSync(this.file_path, 'utf8'));
        }
    }

    private async renew_token(): Promise<TokenData | undefined> {
        try{
            let renew_response = await axios.get(format(RENEW_TOKEN_URL, {access_token: PRIMARY_TOKEN}));
            let {expires_in=0, access_token="", token_type=""} = {...renew_response.data}
            expires_in = expires_in * 1000
            let token_data = {
                expires_at: new Date().getTime() + expires_in,
                access_token: access_token,
                expires_in: expires_in,
                token_type: token_type
            }
            fs.writeFileSync(this.file_path, JSON.stringify(token_data))
            return token_data
        }
        catch(err){
            console.log("something went wrong while trying to request instagram data");
        }
    }

    getToken(): TokenData {
        return this.token!;
    }
}

