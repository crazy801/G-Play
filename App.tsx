
import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import Room from './components/Room';
import VoiceLounge from './components/VoiceLounge';
import Login from './components/Login';
import Profile from './components/Profile';
import RoomsList from './components/RoomsList';
import ChatsList from './components/ChatsList';
import { GameType, UserProfile, Gift } from './types';

interface RoomConfig {
  id: string;
  name: string;
  mode: string;
  tag: string;
  hasPassword?: boolean;
  password?: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'rooms' | 'chats' | 'profile' | 'game'>('home');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [activeRoomConfig, setActiveRoomConfig] = useState<RoomConfig | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('gemini_play_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.giftsReceived === undefined) parsed.giftsReceived = 0;
        if (parsed.giftsSent === undefined) parsed.giftsSent = 0;
        if (parsed.charms === undefined) parsed.charms = 0;
        if (parsed.giftStats === undefined) parsed.giftStats = {};
        setUser(parsed);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    setIsInitialized(true);
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateUser = (updatedProfile: UserProfile) => {
    if (user?.id === updatedProfile.id) {
        setUser(updatedProfile);
        localStorage.setItem('gemini_play_user', JSON.stringify(updatedProfile));
    }
    
    const publicProfiles = JSON.parse(localStorage.getItem('gp_public_profiles') || '[]');
    const index = publicProfiles.findIndex((p: UserProfile) => p.id === updatedProfile.id);
    if (index !== -1) {
      publicProfiles[index] = updatedProfile;
    } else {
      publicProfiles.push(updatedProfile);
    }
    localStorage.setItem('gp_public_profiles', JSON.stringify(publicProfiles));
  };

  const handleAdjustCoins = (amount: number) => {
    if (!user) return false;
    if (user.coins + amount < 0) {
      showNotification("Not enough coins!", "error");
      return false;
    }
    const updated = { ...user, coins: user.coins + amount };
    handleUpdateUser(updated);
    if (amount > 0) showNotification(`Earned ${amount} coins!`, "success");
    return true;
  };

  const handleSendGift = (gift: Gift, recipientId: string, recipientName: string) => {
    if (!user) return false;
    if (user.coins < gift.cost) {
      showNotification(`Need ${gift.cost} coins for ${gift.name}!`, "error");
      return false;
    }

    const updatedSender = { 
      ...user, 
      coins: user.coins - gift.cost,
      giftsSent: user.giftsSent + 1,
      xp: user.xp + gift.xpValue,
      level: Math.floor((user.xp + gift.xpValue) / 1000) + 1
    };
    handleUpdateUser(updatedSender);

    const publicProfiles = JSON.parse(localStorage.getItem('gp_public_profiles') || '[]');
    const recipientIndex = publicProfiles.findIndex((p: UserProfile) => p.id === recipientId);
    if (recipientIndex !== -1) {
      const recipient = publicProfiles[recipientIndex];
      recipient.giftsReceived = (recipient.giftsReceived || 0) + 1;
      const charmsEarned = Math.floor(gift.cost / 10);
      recipient.charms = (recipient.charms || 0) + charmsEarned;
      recipient.xp += gift.xpValue / 2;
      if (!recipient.giftStats) recipient.giftStats = {};
      recipient.giftStats[gift.id] = (recipient.giftStats[gift.id] || 0) + 1;
      localStorage.setItem('gp_public_profiles', JSON.stringify(publicProfiles));
      if (viewedProfile?.id === recipientId) setViewedProfile({...recipient});
    }

    showNotification(`Sent ${gift.icon} to ${recipientName}! (+${gift.xpValue} XP)`, "success");
    return true;
  };

  const handleLogin = (profile: UserProfile) => {
    if (profile.charms === undefined) profile.charms = 0;
    setUser(profile);
    localStorage.setItem('gemini_play_user', JSON.stringify(profile));
    showNotification(`Welcome back, ${profile.name}!`, "success");
  };

  const handleJoinGame = (type: GameType, config?: RoomConfig) => {
    setSelectedGame(type);
    if (config) setActiveRoomConfig(config);
    setCurrentView('game');
  };

  const handleBackToLobby = () => {
    setCurrentView('home');
    setSelectedGame(null);
    setViewedProfile(null);
    setActiveRoomConfig(null);
  };

  const isBrowsing = currentView !== 'game';

  if (!isInitialized) return <div className="min-h-screen bg-[#0f172a]" />;
  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className={`min-h-screen flex flex-col ${isBrowsing ? 'pb-24' : ''}`}>
      {notification && (
        <div className={`fixed top-24 right-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' :
          notification.type === 'error' ? 'bg-rose-600/20 border-rose-500/50 text-rose-400' :
          'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
        }`}>
          <span className="text-xl">
            {notification.type === 'success' ? '✨' : notification.type === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}

      {isBrowsing && (
        <header className="p-4 glass sticky top-0 z-50 flex justify-between items-center px-6 md:px-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToLobby}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center neon-glow">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text hidden sm:block font-serif tracking-tight">GeminiPlay</h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full group">
              <span className="text-amber-400 text-lg">🪙</span>
              <span className="text-amber-400 font-bold text-sm">{user.coins}</span>
            </div>

            <div 
              onClick={() => { setViewedProfile(user); setCurrentView('profile'); }}
              className="flex items-center gap-3 bg-white/5 border border-white/5 pl-2 pr-4 py-1.5 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 p-0.5 border border-indigo-500/30 overflow-hidden">
                 <img src={user.avatar} className="w-full h-full object-cover rounded-lg" alt="Avatar" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Level {user.level}</p>
                <p className="text-xs font-bold leading-none">{user.name}</p>
              </div>
            </div>
            
            <button onClick={() => setUser(null)} className="text-slate-500 hover:text-rose-400 transition-colors p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>
      )}

      <main className="flex-grow">
        {currentView === 'home' && (
          <Lobby onJoinGame={handleJoinGame} onAdjustCoins={handleAdjustCoins} onSendGift={handleSendGift} onOpenUserProfile={(p) => { setViewedProfile(p); setCurrentView('profile'); }} />
        )}
        {currentView === 'rooms' && (
          <RoomsList onJoinRoom={(config) => handleJoinGame(GameType.VOICE_LOUNGE, config)} />
        )}
        {currentView === 'chats' && (
          <ChatsList onOpenChat={(p) => { setViewedProfile(p); setCurrentView('profile'); }} />
        )}
        {currentView === 'profile' && (
          <Profile user={viewedProfile || user} onUpdateUser={handleUpdateUser} onAdjustCoins={handleAdjustCoins} onSendGift={handleSendGift} onBack={handleBackToLobby} isOwnProfile={(viewedProfile ? viewedProfile.id : user.id) === user.id} />
        )}
        {currentView === 'game' && (
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {selectedGame === GameType.VOICE_LOUNGE ? (
              <VoiceLounge user={user} roomConfig={activeRoomConfig || { id: 'R000000', name: 'Chat Room', mode: 'Normal', tag: 'Friends' }} onExit={handleBackToLobby} onSendGift={handleSendGift} />
            ) : (
              <Room gameType={selectedGame!} onExit={handleBackToLobby} onSendGift={handleSendGift} />
            )}
          </div>
        )}
      </main>

      {/* GLOBAL BOTTOM NAV BAR */}
      {isBrowsing && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 pb-safe px-4 py-3 flex justify-around items-center rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => { setCurrentView('home'); setViewedProfile(null); }}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${currentView === 'home' ? 'text-indigo-400 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentView === 'home' ? 'bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-transparent'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
            {currentView === 'home' && <div className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></div>}
          </button>

          <button 
            onClick={() => { setCurrentView('rooms'); setViewedProfile(null); }}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${currentView === 'rooms' ? 'text-indigo-400 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentView === 'rooms' ? 'bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-transparent'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L4 9v12h16V9l-8-6zm6 16h-3v-6h-6v6H6v-9l6-4.5L18 10v9z"/></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Rooms</span>
            {currentView === 'rooms' && <div className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></div>}
          </button>

          <button 
            onClick={() => { setCurrentView('chats'); setViewedProfile(null); }}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${currentView === 'chats' ? 'text-indigo-400 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentView === 'chats' ? 'bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-transparent'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Chats</span>
            {currentView === 'chats' && <div className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></div>}
          </button>

          <button 
            onClick={() => { setViewedProfile(user); setCurrentView('profile'); }}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${currentView === 'profile' && viewedProfile?.id === user?.id ? 'text-indigo-400 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentView === 'profile' && viewedProfile?.id === user?.id ? 'bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-transparent'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Me</span>
            {currentView === 'profile' && viewedProfile?.id === user?.id && <div className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></div>}
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
