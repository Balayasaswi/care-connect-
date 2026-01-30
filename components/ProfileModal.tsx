
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { emailService, EmailConfig } from '../services/emailService';
import { ipfsService, IPFSConfig } from '../services/ipfsService';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onUpdated: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onLogout, onUpdated }) => {
  const [step, setStep] = useState<'view' | 'edit' | 'otp' | 'config_email' | 'config_ipfs'>('view');
  const [newEmail, setNewEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Service Config States
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    serviceId: '',
    templateId: '',
    publicKey: ''
  });

  const [ipfsConfig, setIpfsConfig] = useState<IPFSConfig>({
    apiKey: '',
    apiSecret: ''
  });

  useEffect(() => {
    const savedEmail = emailService.getConfig();
    if (savedEmail) setEmailConfig(savedEmail);

    const savedIpfs = ipfsService.getConfig();
    if (savedIpfs) setIpfsConfig(savedIpfs);
  }, []);

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    emailService.saveConfig(emailConfig);
    setStep('view');
    alert("Email service configuration saved.");
  };

  const handleSaveIpfsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    ipfsService.saveConfig(ipfsConfig);
    setStep('view');
    alert("IPFS storage configuration saved.");
  };

  const handleRequestChange = async () => {
    setIsSending(true);
    setError('');
    try {
      await authService.requestOTP(user.email);
      setStep('otp');
    } catch (err: any) {
      setError("Failed to send verification code. Please check your email config.");
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
          <h2 className="text-2xl font-serif font-bold text-slate-800 mb-1">Sanctuary Settings</h2>
          <p className="text-slate-500 text-sm">Configure your private & decentralized tools.</p>
        </div>

        {step === 'view' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 group">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-2">Authenticated As</label>
              <div className="text-slate-700 font-medium flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>{user.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => setStep('edit')}
                className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <span>Edit Credentials</span>
              </button>
              
              <button 
                onClick={() => setStep('config_email')}
                className="w-full bg-emerald-50 text-emerald-700 font-bold py-4 rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>Email Service (OTP)</span>
              </button>

              <button 
                onClick={() => setStep('config_ipfs')}
                className="w-full bg-blue-50 text-blue-700 font-bold py-4 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <span>IPFS Storage (Real)</span>
              </button>

              <button 
                onClick={onLogout}
                className="w-full bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl hover:bg-rose-100 transition-all"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {step === 'config_ipfs' && (
          <form onSubmit={handleSaveIpfsConfig} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl text-[11px] text-blue-800 mb-4 border border-blue-100">
              <p className="font-bold mb-1">Real IPFS Connection</p>
              Connect to <a href="https://www.pinata.cloud/" target="_blank" className="underline font-bold">Pinata</a> to store your journals on the global decentralized network.
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Pinata API Key</label>
              <input 
                required
                value={ipfsConfig.apiKey} 
                onChange={e => setIpfsConfig({...ipfsConfig, apiKey: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300"
                placeholder="API Key"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Pinata Secret Key</label>
              <input 
                required
                type="password"
                value={ipfsConfig.apiSecret} 
                onChange={e => setIpfsConfig({...ipfsConfig, apiSecret: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300"
                placeholder="Secret API Key"
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={() => setStep('view')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl">Back</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20">Enable Real IPFS</button>
            </div>
          </form>
        )}

        {step === 'config_email' && (
          <form onSubmit={handleSaveEmailConfig} className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-xl text-[11px] text-emerald-800 mb-4 border border-emerald-100">
              Use <a href="https://www.emailjs.com/" target="_blank" className="underline font-bold">EmailJS</a> to receive verification codes in your actual inbox.
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Service ID</label>
              <input required value={emailConfig.serviceId} onChange={e => setEmailConfig({...emailConfig, serviceId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300" placeholder="service_xxxxx" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Template ID</label>
              <input required value={emailConfig.templateId} onChange={e => setEmailConfig({...emailConfig, templateId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300" placeholder="template_xxxxx" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Public Key</label>
              <input required value={emailConfig.publicKey} onChange={e => setEmailConfig({...emailConfig, publicKey: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300" placeholder="user_xxxxx" />
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={() => setStep('view')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl">Back</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20">Save Email Config</button>
            </div>
          </form>
        )}

        {step === 'edit' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 ml-1 block">New Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300" placeholder="new.email@example.com" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 ml-1 block">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300" />
            </div>
            <div className="pt-4 flex space-x-3">
              <button onClick={() => setStep('view')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl">Cancel</button>
              <button onClick={handleRequestChange} disabled={isSending} className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl disabled:opacity-50">
                {isSending ? 'Sending OTP...' : 'Request OTP'}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="text-center">
            <div className="bg-emerald-50 text-emerald-700 p-5 rounded-[2rem] mb-8 text-sm border border-emerald-100">
              <p className="opacity-80">Verification code sent to:</p>
              <p className="font-mono mt-1 font-bold text-emerald-800">{user.email}</p>
            </div>
            <div className="mb-8">
              <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-4xl font-mono tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-2xl p-5 focus:outline-none focus:border-emerald-400" placeholder="000000" />
            </div>
            {error && <p className="text-rose-500 text-xs mb-6 font-medium">{error}</p>}
            <button onClick={handleVerifyOTP} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-95">Verify & Update</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
