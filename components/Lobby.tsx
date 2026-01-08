
import React, { useState, useEffect } from 'react';
import { GameType, UserProfile, GIFTS, Gift } from '../types';

interface LobbyProps {
  onJoinGame: (type: GameType, config?: any) => void;
  onAdjustCoins: (amount: number) => boolean;
  onSendGift: (gift: Gift, recipientId: string, recipientName: string) => boolean;
  onOpenUserProfile: (profile: UserProfile) => void;
}

const GAME_CARDS = [
  { type: GameType.WHO_IS_SPY, title: "Who is the Spy?", description: "Logic and deception party game.", gradient: "from-pink-500 to-rose-600", icon: "🕵️‍♂️" },
  { type: GameType.VOICE_LOUNGE, title: "AI Voice Lounge", description: "Real-time voice chat with Jax.", gradient: "from-indigo-500 to-purple-600", icon: "🎙️" },
  { type: GameType.DRAW_GUESS, title: "Draw & Guess", description: "AI judges your artistic skills.", gradient: "from-emerald-400 to-cyan-500", icon: "🎨" },
  { type: GameType.AI_AVATAR, title: "Avatar Studio", description: "Generate 3D personas.", gradient: "from-amber-400 to-orange-500", icon: "👤" }
];

const ROOM_TAGS = ['Friends', 'Music', 'Game', 'Chats'];
const ROOM_MODES = ['Normal', 'Video', 'Game'];

const generateRoomID = () => {
  return `R${Math.floor(100000 + Math.random() * 900000)}`;
};

const Lobby: React.FC<LobbyProps> = ({ onJoinGame, onAdjustCoins, onSendGift, onOpenUserProfile }) => {
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomForm, setRoomForm] = useState({
    name: '',
    hasPassword: false,
    password: '',
    mode: 'Normal',
    tag: 'Friends'
  });

  useEffect(() => {
    const lastClaim = localStorage.getItem('gemini_last_daily');
    if (lastClaim !== new Date().toDateString()) setCanClaimDaily(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      const publicProfiles = JSON.parse(localStorage.getItem('gp_public_profiles') || '[]');
      const found = publicProfiles.find((p: UserProfile) => p.id.toUpperCase() === searchId.toUpperCase());
      if (found) onOpenUserProfile(found);
      else alert("No user found with that ID.");
      setIsSearching(false);
    }, 600);
  };

  const handleClaimDaily = () => {
    if (onAdjustCoins(50)) {
      localStorage.setItem('gemini_last_daily', new Date().toDateString());
      setCanClaimDaily(false);
    }
  };

  const handleConfirmCreate = () => {
    if (!roomForm.name.trim()) {
      alert("Please enter a room name");
      return;
    }
    if (roomForm.hasPassword && roomForm.password.length !== 4) {
      alert("Password must be exactly 4 digits");
      return;
    }
    setShowCreateModal(false);
    onJoinGame(GameType.VOICE_LOUNGE, {
      id: generateRoomID(),
      name: roomForm.name,
      mode: roomForm.mode,
      tag: roomForm.tag,
      hasPassword: roomForm.hasPassword,
      password: roomForm.password
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 4) setRoomForm({...roomForm, password: val});
  };

  return (
    <div className="px-6 py-8 md:px-12">
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass w-full max-w-xl rounded-[3rem] p-8 md:p-12 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full"></div>
            <button onClick={() => setShowCreateModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white text-2xl p-2 transition-colors z-10">✕</button>
            <h2 className="text-3xl font-black mb-8 gradient-text relative z-10">Create Virtual Room</h2>
            <div className="space-y-6 relative z-10">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block ml-2">Room Name</label>
                <input 
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({...roomForm, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600" 
                  placeholder="Enter a catchy room name..."
                />
              </div>
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-xl">🔒</div>
                  <div>
                    <p className="font-bold text-sm">Room Password</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Privacy Control</p>
                  </div>
                </div>
                <button 
                  onClick={() => setRoomForm({...roomForm, hasPassword: !roomForm.hasPassword})}
                  className={`w-14 h-8 rounded-full transition-all relative ${roomForm.hasPassword ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${roomForm.hasPassword ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              {roomForm.hasPassword && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block ml-2">4-Digit Password</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={roomForm.password}
                    onChange={handlePasswordChange}
                    placeholder="e.g. 1234"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all tracking-[1em] text-center"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 block ml-2">Room Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {ROOM_MODES.map(mode => (
                    <button key={mode} onClick={() => setRoomForm({...roomForm, mode})} className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${roomForm.mode === mode ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-400'}`}>{mode}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 block ml-2">Select Room Tag</label>
                <div className="flex flex-wrap gap-2">
                  {ROOM_TAGS.map(tag => (
                    <button key={tag} onClick={() => setRoomForm({...roomForm, tag})} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border ${roomForm.tag === tag ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>#{tag}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleConfirmCreate} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-5 rounded-2xl font-black text-white shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all mt-4 text-lg">Confirm & Launch</button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-12 flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="w-full flex flex-col md:flex-row gap-4 items-stretch flex-grow max-w-4xl">
          <form onSubmit={handleSearch} className="relative group flex-grow">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
            <input value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="Search Friends by ID (e.g. P482913)" className="w-full glass bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg relative z-10" />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 p-2 rounded-xl hover:bg-indigo-500 transition-colors z-20"><svg className={`w-6 h-6 ${isSearching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
          </form>
          <button onClick={() => setShowCreateModal(true)} className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl font-black text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.5)] transition-all hover:-translate-y-1 active:scale-95 whitespace-nowrap overflow-hidden"><div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div><span className="text-2xl relative z-10">🏠</span><span className="relative z-10 uppercase tracking-widest text-sm">Create Room</span></button>
        </div>
        {canClaimDaily && (
          <button onClick={handleClaimDaily} className="glass p-4 rounded-2xl border-amber-500/20 flex items-center gap-4 hover:scale-105 transition-all w-full lg:w-auto"><span className="text-2xl">🎁</span><div className="text-left"><p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none mb-1">Daily Reward</p><p className="font-bold text-sm">Claim 50 Coins</p></div></button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {GAME_CARDS.map((game) => (
          <div key={game.type} className="group relative overflow-hidden rounded-[2.5rem] cursor-pointer hover:-translate-y-2 transition-all duration-300 shadow-xl" onClick={() => onJoinGame(game.type)}><div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-20 group-hover:opacity-40 transition-opacity`}></div><div className="relative p-8 glass flex flex-col h-full border-white/5 group-hover:border-white/20"><span className="text-5xl mb-6 transform group-hover:rotate-12 transition-transform">{game.icon}</span><h3 className="text-xl font-black mb-2">{game.title}</h3><p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed">{game.description}</p><div className="flex justify-between items-center mt-auto"><span className="text-xs font-bold bg-white/10 px-4 py-1.5 rounded-full text-indigo-200">4-8 Players</span><div className="bg-white text-slate-900 rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg transform group-hover:scale-110 transition-transform">→</div></div></div></div>
        ))}
      </div>
    </div>
  );
};

export default Lobby;
