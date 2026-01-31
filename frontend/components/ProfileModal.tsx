
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onUpdated: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onLogout, onUpdated }) => {
  const [step, setStep] = useState<'view' | 'edit' | 'otp'>('view');
  const [newEmail, setNewEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleRequestChange = async () => {
    setIsSending(true);
    setError('');
    try {
      await authService.requestOTP(user.email);
      setStep('otp');
    } catch (err: any) {
      setError("Failed to send verification code.");
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
      alert("Credentials updated securely.");
    } else {
      setError("Invalid or expired code.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl animate-fade-in relative border border-white/20">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 p-2 hover:bg-slate-50 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-serif font-bold text-slate-800 mb-1">Sanctuary Settings</h2>
          <p className="text-slate-500 text-sm">Your keys are secured on the backend sanctuary.</p>
        </div>

        {step === 'view' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-2">Identity</label>
              <div className="text-slate-700 font-medium flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>{user.email}</span>
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl text-[10px] text-blue-700 border border-blue-100 flex items-start space-x-3">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <p>All sensitive keys (Gemini, Pinata, EmailJS) are now managed by your backend service for maximum security.</p>
            </div>

            <button onClick={() => setStep('edit')} className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              Modify Account Credentials
            </button>
            
            <button onClick={onLogout} className="w-full bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl hover:bg-rose-100 transition-all">
              Log Out
            </button>
          </div>
        )}

        {step === 'edit' && (
          <div className="space-y-4">
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-emerald-300" placeholder="New Email" />
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-emerald-300" placeholder="New Password" />
            <div className="pt-4 flex space-x-3">
              <button onClick={() => setStep('view')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl">Cancel</button>
              <button onClick={handleRequestChange} disabled={isSending} className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl">
                {isSending ? 'Sending...' : 'Request OTP'}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="text-center">
            <div className="mb-8">
              <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-4xl font-mono tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-2xl p-5" placeholder="000000" />
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
