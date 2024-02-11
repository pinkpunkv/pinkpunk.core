import crypto from 'crypto'

export function generate_random_sha256(){
    const verifyCode = crypto.randomBytes(32).toString('hex');
    
    const verificationCode = crypto
      .createHash('sha256')
      .update(verifyCode)
      .digest('hex');
    return verificationCode;
}