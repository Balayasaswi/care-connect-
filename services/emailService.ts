
export class EmailService {
  /**
   * Simulates sending an email to a user.
   * In a production app, this would call a backend or a service like EmailJS/SendGrid.
   */
  public async sendOTP(email: string, otp: string): Promise<void> {
    console.log(`%c[Email Service] Sending to: ${email}`, 'color: #059669; font-weight: bold;');
    console.log(`%c[Email Service] Message: Your Serenity Path verification code is ${otp}`, 'color: #059669;');
    
    // Simulate network latency for the email service
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Display a beautiful browser notification or alert to the user
    // In this environment, we use a styled alert simulation
    const msg = `
      --- SERENITY PATH SECURE MAIL ---
      To: ${email}
      Subject: Verification Code
      
      Your verification code is: ${otp}
      
      This code will expire in 10 minutes. 
      If you did not request this, please ignore this email.
      ---------------------------------
    `;
    alert(msg);
  }
}

export const emailService = new EmailService();
