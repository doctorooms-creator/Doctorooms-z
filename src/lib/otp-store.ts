// In-memory OTP store for forgot-password flow
// In production, this would use Redis or a database table

interface OtpEntry {
  email: string;
  otp: string;
  expiresAt: number;
  verified: boolean;
}

const otpStore = new Map<string, OtpEntry>();

export function generateOTP(email: string): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(email, { email, otp, expiresAt, verified: false });
  return otp;
}

export function verifyOTP(email: string, otp: string): boolean {
  const entry = otpStore.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return false;
  }
  if (entry.otp !== otp) return false;
  entry.verified = true;
  return true;
}

export function isOtpVerified(email: string): boolean {
  const entry = otpStore.get(email);
  return entry?.verified === true;
}

export function clearOtp(email: string): void {
  otpStore.delete(email);
}
