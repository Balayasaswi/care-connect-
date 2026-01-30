
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

  const handleRequestChange = () => {
    authService.generateOTP();
    setStep('otp');
  };

  const handleVerifyOTP = () => {
    if (authService.verifyOTP(otpCode)) {
      authService.updateCredentials(user.email, newEmail, newPassword || undefined);
      onUpdated();
      setStep('view');
      setError('');
      alert("Credentials updated successfully.");
    } else {
      setError("Invalid OTP code.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl animate-fade-in relative overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">Account Settings</h2>
        <p className="text-slate-500 text-sm mb-8">Manage your private identity.</p>

        {step === 'view' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-2">Identity Address</label>
              <div className="text-slate-700 font-medium">{user.email}</div>
            </div>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => setStep('edit')}
                className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-all"
              >
                Change Credentials
              </button>
              <button 
                onClick={onLogout}
                className="w-full bg-rose-50 text-rose-600 font-bold py-3.5 rounded-xl hover:bg-rose-100 transition-all"
              >
                Logout from Sanctuary
              </button>
            </div>
          </div>
        )}

        {step === 'edit' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">New Email</label>
              <input 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">New Password (Optional)</label>
              <input 
                type="password"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300"
              />
            </div>
            <div className="pt-2 flex space-x-3">
              <button onClick={() => setStep('view')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl">Cancel</button>
              <button onClick={handleRequestChange} className="flex-1 bg-emerald-600 text-white font-bold py-3.5 rounded-xl">Verify & Save</button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="text-center">
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl mb-6 text-sm">
              We've simulated sending a code to <strong>{user.email}</strong>. (Check the alert browser popup)
            </div>
            <div className="mb-6">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">6-Digit Verification Code</label>
              <input 
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                className="w-full text-center text-3xl font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400"
                placeholder="000000"
              />
            </div>
            {error && <p className="text-rose-500 text-xs mb-4">{error}</p>}
            <button 
              onClick={handleVerifyOTP}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              Verify Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
