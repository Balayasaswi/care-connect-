
export class MailEngine {
  public async sendOTP(email: string, otp: string) {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: { 
          to_email: email, 
          otp: otp, 
          app_name: 'Serenity Path Sanctuary' 
        }
      })
    });
    return response.ok;
  }
}
