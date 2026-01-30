
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { emailService, EmailConfig } from '../services/emailService';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onUpdated: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onLogout, onUpdated }) => {
  const [step, setStep] = useState<'view' | 'edit' | 'otp' | 'config'>('view');
  const [newEmail, setNewEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Email Config States
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    serviceId: '',
    templateId: '',
    publicKey: ''
  });

  useEffect(() => {
    const saved = emailService.getConfig();
    if (saved) setEmailConfig(saved);
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    emailService.saveConfig(emailConfig);
    setStep('view');
    alert("Email service configuration saved.");
  };

  const handleRequestChange = async () => {
    setIsSending(true);
    setError('');
    try {
      // The OTP is sent to the user's CURRENT email for security
      await authService.requestOTP(user.email);
      setStep('otp');
    } catch (err: any) {
      setError("Failed to send verification code. Please check your config.");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = () => {
    if (authService.verifyOTP(otpCode, user.email)) {
      authService.updateCredentials(user.email, newEmail, newPassword || undefined);
      onUpdated();
      setStep('view');
      setError('');
      alert("Account credentials updated successfully.");
    } else {
      setError("Invalid or expired code. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl animate-fade-in relative overflow-hidden border border-white/20">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-serif font-bold text-slate-800 mb-1">Security Settings</h2>
          <p className="text-slate-500 text-sm">Manage your private identity and credentials.</p>
        </div>

        {step === 'view' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 transition-all hover:border-emerald-100 group">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-2 group-hover:text-emerald-500 transition-colors">Registered Email</label>
              <div className="text-slate-700 font-medium flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>{user.email}</span>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => setStep('edit')}
                className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 hover:border-emerald-200 transition-all shadow-sm active:scale-[0.98]"
              >
                Modify Credentials
              </button>
              <button 
                onClick={() => setStep('config')}
                className="w-full bg-emerald-50 text-emerald-700 font-bold py-4 rounded-2xl hover:bg-emerald-100 transition-all active:scale-[0.98] border border-emerald-100"
              >
                Configure Real Email Service
              </button>
              <button 
                onClick={onLogout}
                className="w-full bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl hover:bg-rose-100 transition-all active:scale-[0.98]"
              >
                Log out of Sanctuary
              </button>
            </div>
          </div>
        )}

        {step === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-xl text-xs text-emerald-800 mb-4">
              Enter your <a href="https://www.emailjs.com/" target="_blank" className="underline font-bold">EmailJS</a> credentials to enable real email delivery to your inbox.
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">EmailJS Service ID</label>
              <input 
                required
                value={emailConfig.serviceId} 
                onChange={e => setEmailConfig({...emailConfig, serviceId: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all"
                placeholder="service_xxxxx"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">EmailJS Template ID</label>
              <input 
                required
                value={emailConfig.templateId} 
                onChange={e => setEmailConfig({...emailConfig, templateId: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all"
                placeholder="template_xxxxx"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">EmailJS Public Key</label>
              <input 
                required
                value={emailConfig.publicKey} 
                onChange={e => setEmailConfig({...emailConfig, publicKey: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all"
                placeholder="user_xxxxxxxxxxxxxxx"
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={() => setStep('view')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-3.5 rounded-xl">Save Config</button>
            </div>
          </form>
        )}

        {step === 'edit' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 ml-1 block">New Email Address</label>
              <input 
                type="email"
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all text-slate-700"
                placeholder="new.email@example.com"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 ml-1 block">New Password (Optional)</label>
              <input 
                type="password"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all text-slate-700"
              />
            </div>
            <div className="pt-4 flex space-x-3">
              <button 
                onClick={() => setStep('view')} 
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleRequestChange} 
                disabled={isSending}
                className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSending ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Sending...</span>
                  </span>
                ) : 'Request OTP'}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="text-center">
            <div className="bg-emerald-50 text-emerald-700 p-5 rounded-[2rem] mb-8 text-sm leading-relaxed border border-emerald-100 animate-fade-in">
              <p className="font-semibold mb-1">Verify your identity</p>
              <p className="opacity-80">A 6-digit verification code was sent to:</p>
              <p className="font-mono mt-1 font-bold text-emerald-800">{user.email}</p>
            </div>
            
            <div className="mb-8">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-3 block tracking-widest">Verification Code</label>
              <input 
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-4xl font-mono tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-2xl p-5 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all text-slate-800"
                placeholder="000000"
              />
            </div>

            {error && (
              <p className="text-rose-500 text-xs mb-6 font-medium bg-rose-50 py-2 rounded-lg border border-rose-100 animate-pulse">
                {error}
              </p>
            )}

            <div className="space-y-3">
              <button 
                onClick={handleVerifyOTP}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-95 hover:bg-emerald-700 transition-all"
              >
                Verify & Update
              </button>
              <button 
                onClick={() => setStep('edit')}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider transition-colors"
              >
                Back to Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
