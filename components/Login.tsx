
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

type AuthStep = 'landing' | 'auth' | 'profile';
type AuthMode = 'login' | 'signup';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zane'
];

const generateGPID = () => {
  // New format: P followed by 6 random digits
  return `P${Math.floor(100000 + Math.random() * 900000)}`;
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<AuthStep>('landing');
  const [mode, setMode] = useState<AuthMode>('signup');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [error, setError] = useState('');

  const getStoredAccounts = () => {
    const data = localStorage.getItem('gemini_play_accounts');
    return data ? JSON.parse(data) : {};
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Fill all fields'); return; }
    const accounts = getStoredAccounts();
    if (mode === 'signup') {
      if (password !== confirmPassword) { setError('Passwords mismatch'); return; }
      if (accounts[email]) { setError('Account exists'); return; }
      setStep('profile');
    } else {
      const user = accounts[email];
      if (user && user.password === password) onLogin(user.profile);
      else setError('Invalid credentials');
    }
  };

  const finalizeRegistration = () => {
    if (!name.trim()) { setError('Choose a name'); return; }
    // Fix: Added missing required property 'charms' to match UserProfile interface
    const newUserProfile: UserProfile = {
      id: generateGPID(),
      name: name,
      avatar: selectedAvatar,
      level: 1,
      xp: 0,
      coins: 100,
      giftsReceived: 0,
      giftsSent: 0,
      charms: 0,
      giftStats: {}
    };
    if (email) {
      const accounts = getStoredAccounts();
      accounts[email] = { password, profile: newUserProfile };
      localStorage.setItem('gemini_play_accounts', JSON.stringify(accounts));
    }
    onLogin(newUserProfile);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/20 to-purple-900/20 pointer-events-none"></div>
      <div className="relative z-10 w-full max-w-md">
        {step === 'landing' && (
          <div className="glass rounded-[2.5rem] p-10 text-center shadow-2xl animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center neon-glow mb-8"><span className="text-white font-bold text-4xl">G</span></div>
            <h1 className="text-4xl font-black mb-2">Gemini<span className="gradient-text">Play</span></h1>
            <p className="text-slate-400 mb-10 text-sm">Unique ID. Global Connections.</p>
            <div className="space-y-4">
              <button onClick={() => { setMode('signup'); setStep('auth'); }} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-bold shadow-xl">Create Account</button>
              <button onClick={() => { setMode('login'); setStep('auth'); }} className="w-full glass py-4 rounded-2xl font-bold">Log In</button>
              <button onClick={() => { setEmail(''); setPassword(''); setStep('profile'); }} className="w-full text-indigo-400 text-sm font-bold">🚀 Continue as Guest</button>
            </div>
          </div>
        )}

        {step === 'auth' && (
          <div className="glass rounded-[2.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom-8">
            <button onClick={() => setStep('landing')} className="text-slate-500 mb-6 text-sm">← Back</button>
            <h2 className="text-3xl font-bold mb-8">{mode === 'signup' ? 'Sign Up' : 'Welcome Back'}</h2>
            {error && <div className="bg-rose-500/10 text-rose-400 text-xs p-3 rounded-xl mb-6">{error}</div>}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {mode === 'signup' && <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />}
              <button type="submit" className="w-full bg-indigo-600 py-4 rounded-2xl font-bold mt-4 shadow-xl">{mode === 'signup' ? 'Register' : 'Login'}</button>
            </form>
          </div>
        )}

        {step === 'profile' && (
          <div className="glass rounded-[2.5rem] p-10 shadow-2xl animate-in slide-in-from-right-8">
             <h2 className="text-2xl font-bold mb-8 text-center">Customize Your <span className="gradient-text">Identity</span></h2>
             <div className="grid grid-cols-3 gap-3 mb-10">
               {AVATAR_OPTIONS.map((url) => (
                 <button key={url} onClick={() => setSelectedAvatar(url)} className={`rounded-2xl overflow-hidden aspect-square border-2 transition-all ${selectedAvatar === url ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20' : 'border-transparent opacity-40 hover:opacity-100'}`}><img src={url} className="w-full h-full" alt="avatar" /></button>
               ))}
             </div>
             <div className="space-y-6">
               <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Display Name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
               <button onClick={finalizeRegistration} className="w-full bg-indigo-600 py-4 rounded-2xl font-bold shadow-xl">Start Playing ✨</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
