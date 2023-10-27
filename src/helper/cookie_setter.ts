import { CookieOptions, Response } from "express";
import {config} from '../config'

const cookiesOptions: CookieOptions = {
    httpOnly: true,
    sameSite: "none",
  };
const accessTokenCookieOptions: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
        Date.now() + config.accessTokenExpiresIn*24*60*60*1000
    ),
    maxAge: config.accessTokenExpiresIn*24*60*60*1000,
};


const refreshTokenCookieOptions: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
        Date.now() + config.refreshTokenExpiresIn*24*60*60*1000
    ),
    maxAge: config.refreshTokenExpiresIn*24*60*60*1000,
};

export function set_cookie(res:Response, access_token:string, refresh_token:string){
    res.cookie('p_act', access_token, accessTokenCookieOptions);
    res.cookie('p_rft', refresh_token, refreshTokenCookieOptions);
    res.cookie('lin', true, {...accessTokenCookieOptions,httpOnly: false,});
}