import * as OTPAuth from "otpauth";

const ISSUER = "SteelX Admin";
const LABEL = "admin";

export function generateSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

export function getTOTP(secret: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: LABEL,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export function verifyCode(secret: string, code: string): boolean {
  const totp = getTOTP(secret);
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export function getOTPAuthURI(secret: string): string {
  const totp = getTOTP(secret);
  return totp.toString();
}
