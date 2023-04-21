import crypto from 'crypto'

export default function generateToken(){
    const verifyCode = crypto.randomBytes(32).toString('hex');
    
    const verificationCode = crypto
      .createHash('sha256')
      .update(verifyCode)
      .digest('hex');
    return verificationCode;
}