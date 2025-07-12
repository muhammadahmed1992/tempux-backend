export class Utils {
  /**
   * Generates a 6-digit random OTP.
   * @returns {string} The 6-digit OTP as a string.
   */
  public static generateOtp(): string {
    // For a 6-digit number, we want a number between 100,000 and 999,999.
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
  }
}
