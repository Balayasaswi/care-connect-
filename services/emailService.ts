
import { server } from "../api";

export class EmailService {
  /**
   * Requests the backend to send a real email via its secure secrets.
   */
  public async sendOTP(email: string, otp: string): Promise<void> {
    try {
      const success = await server.sendMail(email, otp);
      if (success) {
        console.log(`%c[Backend Mail] Sent OTP to ${email}`, 'color: #059669; font-weight: bold;');
      } else {
        throw new Error("Backend mail dispatch failed");
      }
    } catch (error) {
      console.error("Mail Service Error:", error);
      alert(`Backend Mail Error. Your code is: ${otp} (Fallback)`);
    }
  }
}

export const emailService = new EmailService();
