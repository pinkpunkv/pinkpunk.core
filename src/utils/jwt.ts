import jwt, { SignOptions } from 'jsonwebtoken';
import {config} from '../config';

// ? Sign Access or Refresh Token
export const signJwt = (
  payload: any,
  keyName: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey',
  options: SignOptions
) => {
  console.log(config[keyName]);
  return jwt.sign(payload, config[keyName], {algorithm:"HS256",...options});
};

export const verifyJwt=(token:string,keyName: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey')=>{
  return jwt.verify(token,config[keyName])
}

// ? Verify Access or Refresh Token
