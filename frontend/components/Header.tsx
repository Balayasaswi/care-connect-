import React from 'react';

interface HeaderProps {
  onMenuToggle: () => void;
  walletAddress: string | null;
  onConnectWallet: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, walletAddress, onConnectWallet }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-20 px-4 md:px-6 py-4 ml-0 md:ml-72">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onMenuToggle}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-serif font-semibold text-slate-800 tracking-tight leading-none">Serenity Path</h1>
            <p className="text-[10px] md:text-xs text-emerald-600 font-medium">Safe & Secure</p>
          </div>
        </div>
        
        <button 
          onClick={onConnectWallet}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all duration-300 text-[10px] md:text-xs font-bold uppercase tracking-wider ${
            walletAddress 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
              : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/30'
          }`}
        >
          {walletAddress ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a9.994 9.994 0 008.474-4.691m-1.29-3.44a10.042 10.042 0 01-4.69 8.474M15 9a3 3 0 11-6 0 3 3 0 016 0zm6 3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;