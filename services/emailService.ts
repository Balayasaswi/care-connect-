
export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export class EmailService {
  private CONFIG_KEY = 'serenity_email_config';

  public saveConfig(config: EmailConfig) {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
  }

  public getConfig(): EmailConfig | null {
    const saved = localStorage.getItem(this.CONFIG_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Sends a real email via EmailJS REST API.
   */
  public async sendOTP(email: string, otp: string): Promise<void> {
    const config = this.getConfig();

    if (!config || !config.publicKey || !config.serviceId || !config.templateId) {
      console.warn("Email configuration missing. Falling back to console log + alert.");
      this.fallbackAlert(email, otp);
      return;
    }

    const data = {
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      template_params: {
        'to_email': email,
        'otp': otp,
        'app_name': 'Serenity Path'
      }
    };

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`EmailJS Error: ${errText}`);
      }

      console.log(`%c[Email Service] Successfully sent real email to ${email}`, 'color: #059669; font-weight: bold;');
    } catch (error) {
      console.error("Failed to send real email:", error);
      this.fallbackAlert(email, otp, true);
    }
  }

  private fallbackAlert(email: string, otp: string, isError = false) {
    const msg = `
      ${isError ? '!!! ERROR SENDING REAL EMAIL !!!\n' : ''}
      --- SERENITY PATH SECURE MAIL (MOCK) ---
      To: ${email}
      Subject: Verification Code
      
      Your verification code is: ${otp}
      
      ${!isError ? 'NOTE: Configure EmailJS in Profile Settings to send real emails to your inbox.' : 'Please check your EmailJS configuration in Settings.'}
      ---------------------------------
    `;
    alert(msg);
  }
}

export const emailService = new EmailService();
