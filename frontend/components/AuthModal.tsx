
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthModalProps {
  onAuthenticated: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const user = await authService.login(email, password);
        onAuthenticated(user);
      } else {
        const user = await authService.register(email, password);
        onAuthenticated(user);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">{isLogin ? 'Welcome Back' : 'Join Serenity'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-emerald-300 transition-all" placeholder="Email" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-emerald-300 transition-all" placeholder="Password" />
          {error && <div className="bg-rose-50 text-rose-600 text-xs py-3 px-4 rounded-xl text-center border border-rose-100">{error}</div>}
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50">
            {isLoading ? 'Synchronizing...' : (isLogin ? 'Enter Sanctuary' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-emerald-600 font-bold hover:underline">
            {isLogin ? "Need an account? Sign Up" : "Already registered? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
