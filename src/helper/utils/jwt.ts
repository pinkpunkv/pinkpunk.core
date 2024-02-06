import { ENV } from '@abstract/env';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const SECRET_KEYS = {
  accessTokenPrivateKey:ENV.get("accessTokenPrivateKey"),
  refreshTokenPrivateKey:ENV.get("refreshTokenPrivateKey"),   
}
// ? Sign Access or Refresh Token
export const sign_jwt = (
  payload: any,
  keyName: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey',
  options: SignOptions
) => {
  return jwt.sign(payload, SECRET_KEYS[keyName]!, {algorithm:"HS256",...options});
};

export const verify_jwt=(token:string, keyName: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey')=>{
  return jwt.verify(token,SECRET_KEYS[keyName]!) as JwtPayload
}

// ? Verify Access or Refresh Token
