import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import {config} from '../config';

// ? Sign Access or Refresh Token
export const sign_jwt = (
  payload: any,
  keyName: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey',
  options: SignOptions
) => {
  return jwt.sign(payload, config[keyName]!, {algorithm:"HS256",...options});
};

export const verify_jwt=(token:string,keyName: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey')=>{
  return jwt.verify(token,config[keyName]!) as JwtPayload
}

// ? Verify Access or Refresh Token
