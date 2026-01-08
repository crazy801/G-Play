
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Gift, GIFTS, Message } from '../types';

interface VoiceLoungeProps {
  onExit: () => void;
  user: UserProfile;
  roomConfig: {
    id: string;
    name: string;
    mode: string;
    tag: string;
    hasPassword?: boolean;
    password?: string;
  };
  onSendGift: (gift: Gift, recipientId: string, recipientName: string) => boolean;
}

interface SeatStatus {
  isLocked: boolean;
  isMuted: boolean;
}

const ROOM_TAGS = ['Friends', 'Music', 'Games', 'Chats'];
const ROOM_MODES = ['Normal', 'Video', 'Games'];
const ROOM_THEMES = [
  { id: 'indigo', class: 'bg-gradient-to-b from-slate-950 to-indigo-950/40', name: 'Indigo Night' },
  { id: 'dark', class: 'bg-slate-950', name: 'Midnight' },
  { id: 'purple', class: 'bg-gradient-to-br from-purple-900 via-slate-950 to-indigo-900', name: 'Nebula' },
  { id: 'emerald', class: 'bg-gradient-to-b from-emerald-950 to-slate-950', name: 'Deep Forest' }
];

const MOCK_GIFS = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwJmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKMGpxx6r1o9oK4/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwJmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlU7e8uM7y4lW6A/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwJmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKVUn7iM8FMEU24/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwZndwJmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l41lTfORfXoVqO9Q4/giphy.gif'
];

const VoiceLounge: React.FC<VoiceLoungeProps> = ({ onExit, user, roomConfig, onSendGift }) => {
  const isOwner = true; // In this mockup, the active user is treated as the room creator/owner

  // Room Settings State
  const [roomName, setRoomName] = useState(roomConfig.name);
  const [currentMode, setCurrentMode] = useState(roomConfig.mode);
  const [currentTag, setCurrentTag] = useState(roomConfig.tag);
  const [announcement, setAnnouncement] = useState('Welcome to our room! Everyone is welcome to chat and share.');
  const [roomBg, setRoomBg] = useState(ROOM_THEMES[0].class);
  const [partnerSeatEnabled, setPartnerSeatEnabled] = useState(true);
  const [banTextChatting, setBanTextChatting] = useState(false);
  const [banPhotoChatting, setBanPhotoChatting] = useState(false);
  const [roomPassword, setRoomPassword] = useState(roomConfig.password || '1234');
  const [isRoomLocked, setIsRoomLocked] = useState(roomConfig.hasPassword || false);

  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Seat Management
  const [occupiedSeats, setOccupiedSeats] = useState<Record<number, UserProfile | null>>({
    1: user, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null, 10: null,
  });
  const [seatStatuses, setSeatStatuses] = useState<Record<number, SeatStatus>>(
    Object.fromEntries([...Array(10)].map((_, i) => [i + 1, { isLocked: false, isMuted: false }]))
  );

  // Chat/Messages State
  const [messages, setMessages] = useState<(Message & { image?: string; gift?: Gift; recipientName?: string })[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showGifSelector, setShowGifSelector] = useState(false);
  
  // UI Panels
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [selectedSeatForAction, setSelectedSeatForAction] = useState<number | null>(null);
  const [giftRecipient, setGiftRecipient] = useState<{ id: string; name: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addMessage = (senderId: string, text: string, image?: string, gift?: Gift, recipientName?: string) => {
    const newMessage = { 
      id: Math.random().toString(36).substr(2, 9), 
      senderId, 
      text, 
      image,
      gift,
      recipientName,
      timestamp: Date.now() 
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (banTextChatting) return;
    if (!chatInput.trim()) return;
    addMessage(user.id, chatInput);
    setChatInput('');
  };

  const handleSendPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (banPhotoChatting) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        addMessage(user.id, "Shared a photo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendGif = (gifUrl: string) => {
    if (banPhotoChatting) return;
    addMessage(user.id, "Shared a GIF", gifUrl);
    setShowGifSelector(false);
  };

  const handleSeatClick = (id: number) => {
    setSelectedSeatForAction(id);
  };

  const openGiftPanelFor = (p: UserProfile) => {
    setGiftRecipient({ id: p.id, name: p.name });
    setShowGiftPanel(true);
    setSelectedSeatForAction(null);
  };

  const handleTriggerGift = (gift: Gift) => {
    if (!giftRecipient) return;
    const success = onSendGift(gift, giftRecipient.id, giftRecipient.name);
    if (success) {
      addMessage(user.id, `Sent ${gift.name} to ${giftRecipient.name}`, undefined, gift, giftRecipient.name);
      setShowGiftPanel(false);
      setGiftRecipient(null);
    }
  };

  const renderSeat = (id: number, size: 'large' | 'small' = 'small') => {
    const occupant = occupiedSeats[id];
    const status = seatStatuses[id];
    const isSelf = occupant?.id === user.id;
    const isPartnerSeat = id === 2;
    const isLarge = size === 'large';
    
    if (isPartnerSeat && !partnerSeatEnabled && !occupant) {
      return (
        <div key={id} className="flex flex-col items-center gap-2 opacity-5 pointer-events-none scale-90">
          <div className={`${isLarge ? 'w-24 h-24' : 'w-16 h-16'} rounded-full border-2 border-slate-800 flex items-center justify-center`}><span className="text-xl">🚫</span></div>
          <p className="text-[10px] font-black uppercase tracking-tighter text-slate-700">Off</p>
        </div>
      );
    }

    return (
      <div key={id} className="flex flex-col items-center gap-2 group transition-all cursor-pointer hover:scale-105" onClick={() => handleSeatClick(id)}>
        <div className={`relative ${isLarge ? 'w-24 h-24' : 'w-16 h-16'} flex items-center justify-center`}>
          <div className={`absolute inset-0 rounded-full border-2 border-dashed ${occupant ? (isSelf ? 'border-indigo-500 animate-spin-slow' : 'border-emerald-500') : (status.isLocked ? 'border-rose-500/50' : 'border-white/10 group-hover:border-indigo-500/50')} transition-all`}></div>
          <div className={`relative ${isLarge ? 'w-20 h-20' : 'w-12 h-12'} rounded-full overflow-hidden ${occupant ? 'bg-slate-800' : 'bg-white/5'} shadow-xl flex items-center justify-center border border-white/10`}>
            {status.isLocked && !occupant ? <span className="text-xl opacity-40">🔒</span> : occupant ? <img src={occupant.avatar} className="w-full h-full object-cover" alt={occupant.name} /> : <span className="text-lg text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity">+</span>}
            {isSelf && <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/90 text-[8px] font-black uppercase text-center py-0.5 tracking-tighter text-white">YOU</div>}
          </div>
          <div className="absolute -top-1 -right-1 flex flex-col gap-1">
            {occupant && <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg"><span className="text-[10px]">{isSelf ? '👑' : '🔊'}</span></div>}
            {status.isMuted && <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg"><span className="text-[10px]">🔇</span></div>}
          </div>
          <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 text-[8px] font-bold text-slate-400">{id}</div>
        </div>
        <p className={`text-[10px] font-black truncate uppercase tracking-tighter ${occupant ? (isSelf ? 'text-indigo-400' : 'text-white') : (status.isLocked ? 'text-rose-400' : 'text-slate-500')}`}>{occupant ? occupant.name : (status.isLocked ? 'Locked' : 'Open')}</p>
      </div>
    );
  };

  return (
    <div className="min-h-[85vh] flex flex-col lg:flex-row gap-6 relative">
      
      {/* --- ROOM SETTINGS PAGE --- */}
      {showSettingsPage && (
        <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
           <header className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-4">
                 <button onClick={() => setShowSettingsPage(false)} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                 </button>
                 <div>
                    <h2 className="text-2xl font-black gradient-text">Room Settings</h2>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{roomConfig.id}</p>
                 </div>
              </div>
              <button onClick={() => { setShowSettingsPage(false); addMessage('system', 'Room updated by owner.'); }} className="px-10 py-3 bg-indigo-600 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">Save Changes</button>
           </header>
           
           <div className="flex-grow overflow-y-auto p-6 md:p-16 max-w-4xl mx-auto w-full space-y-12 pb-32">
              <section className="space-y-6">
                 <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest border-l-4 border-indigo-500 pl-4">Basic Info</h3>
                 <div className="space-y-4">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-2">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Room Name</label>
                       <input value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full bg-transparent border-none text-2xl font-black focus:ring-0 outline-none p-0" />
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-2">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Announcement</label>
                       <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} className="w-full bg-transparent border-none text-lg font-medium focus:ring-0 outline-none p-0 h-28 resize-none" />
                    </div>
                 </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest border-l-4 border-indigo-500 pl-4">Mode</h3>
                    <div className="bg-white/5 p-2 rounded-[2rem] border border-white/10 grid grid-cols-3 gap-1">
                       {ROOM_MODES.map(m => (
                          <button key={m} onClick={() => setCurrentMode(m)} className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${currentMode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{m}</button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest border-l-4 border-indigo-500 pl-4">Tag</h3>
                    <div className="bg-white/5 p-2 rounded-[2rem] border border-white/10 flex flex-wrap gap-1">
                       {ROOM_TAGS.map(t => (
                          <button key={t} onClick={() => setCurrentTag(t)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${currentTag === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>#{t}</button>
                       ))}
                    </div>
                 </div>
              </section>

              <section className="space-y-6">
                 <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest border-l-4 border-indigo-500 pl-4">Theme</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {ROOM_THEMES.map(theme => (
                       <button key={theme.id} onClick={() => setRoomBg(theme.class)} className={`p-4 rounded-[2rem] border-2 transition-all ${roomBg === theme.class ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}>
                          <div className={`h-14 w-full rounded-2xl mb-3 shadow-2xl ${theme.class}`}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest block text-center">{theme.name}</span>
                       </button>
                    ))}
                 </div>
              </section>

              <section className="space-y-6">
                 <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest border-l-4 border-indigo-500 pl-4">Controls</h3>
                 <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2rem] border border-white/10">
                       <span className="font-black text-sm uppercase tracking-widest">Partner Seat (Seat 2)</span>
                       <button onClick={() => setPartnerSeatEnabled(!partnerSeatEnabled)} className={`w-14 h-8 rounded-full transition-all relative ${partnerSeatEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${partnerSeatEnabled ? 'left-7' : 'left-1'}`}></div></button>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2rem] border border-white/10">
                       <span className="font-black text-sm uppercase tracking-widest">Ban Text Chatting</span>
                       <button onClick={() => setBanTextChatting(!banTextChatting)} className={`w-14 h-8 rounded-full transition-all relative ${banTextChatting ? 'bg-rose-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${banTextChatting ? 'left-7' : 'left-1'}`}></div></button>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2rem] border border-white/10">
                       <span className="font-black text-sm uppercase tracking-widest">Ban Photo Chatting</span>
                       <button onClick={() => setBanPhotoChatting(!banPhotoChatting)} className={`w-14 h-8 rounded-full transition-all relative ${banPhotoChatting ? 'bg-rose-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${banPhotoChatting ? 'left-7' : 'left-1'}`}></div></button>
                    </div>
                 </div>
              </section>

              <section className="p-10 bg-indigo-900/10 border border-indigo-500/20 rounded-[3rem] shadow-2xl space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-widest">Room Password</h3>
                    <button onClick={() => setIsRoomLocked(!isRoomLocked)} className={`text-[10px] font-black uppercase px-6 py-2 rounded-full transition-all ${isRoomLocked ? 'bg-rose-500/20 text-rose-500' : 'bg-white/10 text-slate-400'}`}>{isRoomLocked ? 'Disable' : 'Enable'}</button>
                 </div>
                 {isRoomLocked && (
                    <div className="space-y-4">
                       <input value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} maxLength={4} className="w-full bg-slate-950/50 border border-white/20 rounded-[2rem] px-6 py-6 font-black tracking-[1.5em] text-center text-4xl text-indigo-400 outline-none" />
                       <p className="text-center text-xs font-black text-indigo-400 uppercase tracking-widest">Owner Password View: {roomPassword}</p>
                    </div>
                 )}
              </section>
           </div>
        </div>
      )}

      {/* --- MAIN ROOM INTERFACE --- */}
      <div className={`flex-grow glass rounded-[3rem] p-8 border-white/5 relative overflow-hidden ${roomBg} shadow-2xl flex flex-col transition-all duration-1000`}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-start mb-12 relative z-10">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                 <h2 className="text-2xl font-black text-white">{roomName}</h2>
                 <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">{roomConfig.id}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">#{currentTag} • {currentMode} Mode</p>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
             <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group">
                <span className="text-xl text-slate-400 group-hover:text-white">•••</span>
             </button>

             {showMoreMenu && (
               <div className="absolute top-full right-0 mt-3 w-64 glass rounded-3xl p-3 border border-white/10 shadow-2xl z-[100] animate-in slide-in-from-top-4 duration-200">
                  <div className="space-y-1">
                    <p className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Room Function</p>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-bold flex items-center gap-3"><span>🤝</span> Invite Friends</button>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-bold flex items-center gap-3 text-rose-400"><span>⚠️</span> Report Room</button>
                    <button onClick={onExit} className="w-full text-left px-4 py-3 rounded-xl hover:bg-rose-500/10 text-sm font-bold flex items-center gap-3 text-rose-500"><span>🚪</span> Exit</button>
                    {isOwner && (
                       <button onClick={() => { setShowSettingsPage(true); setShowMoreMenu(false); }} className="w-full mt-2 px-4 py-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><span>⚙️</span> SETTINGS</button>
                    )}
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center relative z-10">
          <div className="flex justify-center gap-16 mb-20">
            {renderSeat(1, 'large')}
            {renderSeat(2, 'large')}
          </div>
          <div className="grid grid-cols-4 gap-x-12 gap-y-12 max-w-2xl w-full px-4">
            {[3, 4, 5, 6, 7, 8, 9, 10].map(id => renderSeat(id, 'small'))}
          </div>
        </div>

        <div className="mt-auto pt-8 flex justify-center items-center gap-4 relative z-10">
          <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-[2rem] border border-white/5 shadow-2xl">
            <button onClick={() => setIsMuted(!isMuted)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white shadow-indigo-500/20'}`}><span className="text-2xl">{isMuted ? '🔇' : '🎙️'}</span></button>
            <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${isSpeakerOn ? 'bg-white/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-500 border-white/10'}`}><span className="text-xl">{isSpeakerOn ? '🔊' : '🔈'}</span></button>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-[2rem] border border-white/5 shadow-2xl">
             <button onClick={() => { setGiftRecipient({ id: user.id, name: user.name }); setShowGiftPanel(true); }} className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-xl hover:bg-white/10 transition-all">🎁</button>
             <button onClick={() => setShowChat(!showChat)} className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${showChat ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/5 text-slate-500 border-white/10'}`}><span className="text-xl">💬</span></button>
          </div>
        </div>
      </div>

      {/* --- CHAT SECTION --- */}
      {showChat && (
        <div className="w-full lg:w-96 glass rounded-[3rem] border-white/5 flex flex-col shadow-2xl animate-in slide-in-from-right-full duration-500 bg-slate-950/20">
           <div className="p-6 border-b border-white/5 flex items-center justify-between"><h3 className="font-black text-white uppercase tracking-widest text-[10px]">Room Chat Feed</h3></div>
           
           <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-hide">
              <div className="text-center py-2 px-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-4"><p className="text-[10px] font-bold text-indigo-400 uppercase leading-relaxed tracking-wider">Announcement: {announcement}</p></div>
              {messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                const isSystem = msg.senderId === 'system';
                if (isSystem) return <div key={msg.id} className="text-center py-1"><span className="text-[9px] font-black uppercase tracking-widest text-slate-600 bg-white/5 px-3 py-1 rounded-full">{msg.text}</span></div>;
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-xs max-w-[95%] font-medium leading-relaxed ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-300 rounded-tl-none shadow-sm'}`}>
                        {msg.gift ? (
                          <div className="flex items-center gap-3">
                             <div className="text-3xl bg-white/10 p-2 rounded-xl">{msg.gift.icon}</div>
                             <div className="text-left">
                                <p className="font-black uppercase tracking-tighter text-[9px] text-amber-400">Gift Shared!</p>
                                <p className="font-bold text-[11px]">{msg.text}</p>
                             </div>
                          </div>
                        ) : msg.image ? (
                          <div className="space-y-2">
                             <img src={msg.image} className="rounded-xl max-w-full h-auto border border-white/10 shadow-lg" alt="Shared" />
                             <p className="opacity-70">{msg.text}</p>
                          </div>
                        ) : (
                          msg.text
                        )}
                    </div>
                  </div>
                );
              })}
           </div>

           {/* GIF Selector popover */}
           {showGifSelector && (
              <div className="p-4 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 animate-in slide-in-from-bottom-2">
                 <div className="flex justify-between items-center mb-3 px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trending GIFs</span>
                    <button onClick={() => setShowGifSelector(false)} className="text-slate-500 hover:text-white">✕</button>
                 </div>
                 <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
                    {MOCK_GIFS.map((gif, i) => (
                       <button key={i} onClick={() => handleSendGif(gif)} className="rounded-xl overflow-hidden hover:scale-95 transition-transform border border-white/5 shadow-sm">
                          <img src={gif} className="w-full h-24 object-cover" alt="GIF" />
                       </button>
                    ))}
                 </div>
              </div>
           )}

           <div className="p-6 border-t border-white/5 bg-slate-900/60 backdrop-blur-md">
              <form onSubmit={handleSendChat} className="relative group flex items-center gap-2">
                <div className="flex-grow relative">
                   <input 
                      value={chatInput} 
                      onChange={(e) => setChatInput(e.target.value)} 
                      disabled={banTextChatting} 
                      placeholder={banTextChatting ? "Text chat disabled" : "Message everyone..."} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs focus:ring-2 focus:ring-indigo-500 pr-12 font-bold disabled:opacity-50 outline-none transition-all" 
                    />
                    <button type="submit" disabled={banTextChatting || !chatInput.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 p-2 disabled:opacity-0 transition-all hover:scale-110 active:scale-90"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
                </div>
                
                <div className="flex items-center gap-1.5">
                   <button type="button" onClick={() => photoInputRef.current?.click()} disabled={banPhotoChatting} className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors disabled:opacity-30">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </button>
                   <button type="button" onClick={() => setShowGifSelector(!showGifSelector)} disabled={banPhotoChatting} className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-[10px] transition-all disabled:opacity-30 ${showGifSelector ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>GIF</button>
                </div>
                <input type="file" ref={photoInputRef} onChange={handleSendPhoto} className="hidden" accept="image/*" />
              </form>
           </div>
        </div>
      )}

      {/* Seat Interaction Modal */}
      {selectedSeatForAction !== null && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-6">
          <div className="glass w-full max-w-sm rounded-[3rem] p-8 border-white/10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex flex-col items-center mb-6">
               <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-indigo-500 mb-4 shadow-xl bg-slate-800">
                  {occupiedSeats[selectedSeatForAction] ? (
                     <img src={occupiedSeats[selectedSeatForAction]!.avatar} className="w-full h-full object-cover" alt="Occupant" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">👤</div>
                  )}
               </div>
               <h3 className="text-xl font-black text-white">{occupiedSeats[selectedSeatForAction]?.name || `Seat ${selectedSeatForAction}`}</h3>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Room Member</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {occupiedSeats[selectedSeatForAction] && (
                 <button onClick={() => openGiftPanelFor(occupiedSeats[selectedSeatForAction]!)} className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 font-black text-[11px] uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"><span>🎁</span> Send Gift</button>
              )}
              {isOwner && (
                 <>
                    <button onClick={() => { setSeatStatuses(prev => ({ ...prev, [selectedSeatForAction!]: { ...prev[selectedSeatForAction!], isLocked: !prev[selectedSeatForAction!].isLocked } })); setSelectedSeatForAction(null); }} className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase border transition-all ${seatStatuses[selectedSeatForAction].isLocked ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>{seatStatuses[selectedSeatForAction].isLocked ? 'Open Seat' : 'Close Seat'}</button>
                    <button onClick={() => { setSeatStatuses(prev => ({ ...prev, [selectedSeatForAction!]: { ...prev[selectedSeatForAction!], isMuted: !prev[selectedSeatForAction!].isMuted } })); setSelectedSeatForAction(null); }} className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase border transition-all ${seatStatuses[selectedSeatForAction].isMuted ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-white/5 text-slate-300'}`}>{seatStatuses[selectedSeatForAction].isMuted ? 'Unmute' : 'Mute'}</button>
                 </>
              )}
              <button onClick={() => setSelectedSeatForAction(null)} className="w-full py-4 rounded-2xl text-slate-500 font-black uppercase text-[10px] hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Gift Panel */}
      {showGiftPanel && giftRecipient && (
        <div className="absolute inset-0 z-[700] flex items-end justify-center pb-32 bg-slate-950/40 backdrop-blur-xl p-4 animate-in slide-in-from-bottom-full duration-300">
          <div className="glass w-full max-w-xl rounded-[3rem] p-8 border-white/10 shadow-2xl relative">
             <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-widest">Gift Selection</h3>
                   <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Recipient: {giftRecipient.name}{giftRecipient.id === user.id ? ' (Self)' : ''}</p>
                </div>
                <button onClick={() => setShowGiftPanel(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-all border border-white/10 shadow-lg">✕</button>
             </div>
             
             <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {GIFTS.map(gift => (
                   <button 
                      key={gift.id} 
                      onClick={() => handleTriggerGift(gift)} 
                      className="flex flex-col items-center gap-2 p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group relative overflow-hidden"
                   >
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-pink-500/0 group-hover:from-rose-500/10 group-hover:to-pink-500/10 transition-all"></div>
                      <span className="text-3xl group-hover:scale-125 transition-transform relative z-10">{gift.icon}</span>
                      <span className="text-[10px] font-black text-amber-400 relative z-10 bg-amber-400/10 px-2 py-0.5 rounded-full">{gift.cost} 🪙</span>
                   </button>
                ))}
             </div>
             <p className="text-center text-[10px] text-slate-500 font-bold uppercase mt-8 tracking-widest leading-relaxed">Choose a gift to surprise {giftRecipient.name}.<br/>All room members can see your generous gift!</p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 25s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
      `}} />
    </div>
  );
};

export default VoiceLounge;
