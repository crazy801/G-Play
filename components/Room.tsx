
import React, { useState, useEffect, useRef } from 'react';
import { GameType, Player, Message, Gift, GIFTS } from '../types';
import { GoogleGenAI } from "@google/genai";

interface RoomProps {
  gameType: GameType;
  onExit: () => void;
  // Fix: Added recipientId parameter to match handleSendGift in App.tsx
  onSendGift: (gift: Gift, recipientId: string, recipientName: string) => boolean;
}

const INITIAL_PLAYERS: Player[] = [
  { id: '1', name: 'You', avatar: 'https://picsum.photos/seed/you/100', isAI: false, isSelf: true },
  { id: '2', name: 'Gemini-Bot', avatar: 'https://picsum.photos/seed/gem/100', isAI: true },
  { id: '3', name: 'Alpha', avatar: 'https://picsum.photos/seed/alpha/100', isAI: true },
  { id: '4', name: 'Neon-Girl', avatar: 'https://picsum.photos/seed/neon/100', isAI: true },
];

const Room: React.FC<RoomProps> = ({ gameType, onExit, onSendGift }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'voting'>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [giftAnimation, setGiftAnimation] = useState<{ icon: string; x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (senderId: string, text: string) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId,
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const userText = customText || input;
    if (!userText.trim() || isLoading) return;

    if (!customText) setInput('');
    addMessage('1', userText);

    setIsLoading(true);
    try {
      // Create a new instance right before generating content
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are playing "${gameType}" with a human user. The user just said: "${userText}". 
      Respond as a competitive but fun AI player named Gemini-Bot. Keep it short and witty. 
      If the user sent a gift, be extremely grateful and maybe give them a "hint" (even if fake) or a compliment.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      // Property access .text instead of .text()
      if (response.text) {
        addMessage('2', response.text);
      }
    } catch (err) {
      console.error(err);
      addMessage('2', "Thanks for the vibe! Let's keep playing.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerGift = (gift: Gift, player: Player) => {
    // Fix: Added player.id as the recipientId argument to match updated prop signature
    if (onSendGift(gift, player.id, player.name)) {
      // Create local animation
      setGiftAnimation({ icon: gift.icon, x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setTimeout(() => setGiftAnimation(null), 1500);

      if (player.isAI) {
        handleSendMessage(undefined, `Here is a ${gift.name} for you, ${player.name}! ${gift.icon}`);
      }
      setSelectedPlayer(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] relative">
      {/* Gift Animation Layer */}
      {giftAnimation && (
        <div 
          className="fixed z-[200] pointer-events-none text-6xl animate-bounce"
          style={{ left: giftAnimation.x, top: giftAnimation.y }}
        >
          {giftAnimation.icon}
        </div>
      )}

      {/* Player Action Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-sm rounded-[2.5rem] p-8 border-white/10 shadow-2xl scale-in-center">
            <div className="flex flex-col items-center mb-8">
               <div className="w-24 h-24 rounded-3xl overflow-hidden mb-4 border-2 border-indigo-500 shadow-xl">
                 <img src={selectedPlayer.avatar} className="w-full h-full object-cover" alt={selectedPlayer.name} />
               </div>
               <h3 className="text-xl font-bold">{selectedPlayer.name}</h3>
               {selectedPlayer.isAI && <span className="text-xs text-indigo-400 font-mono">AI PLAYER</span>}
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold text-center mb-4">Send a Gift</p>
              <div className="grid grid-cols-3 gap-3">
                {GIFTS.map((gift) => (
                  <button 
                    key={gift.id}
                    onClick={() => triggerGift(gift, selectedPlayer)}
                    className="flex flex-col items-center gap-1 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-125 transition-transform">{gift.icon}</span>
                    <span className="text-[10px] font-bold text-amber-400">{gift.cost}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setSelectedPlayer(null)}
              className="w-full mt-8 py-3 rounded-xl text-slate-400 hover:text-white font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className="flex-grow glass rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <button 
          onClick={onExit}
          className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors"
        >
          ← Exit Room
        </button>

        <div className="text-center mb-12">
          <span className="bg-indigo-500/20 text-indigo-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">
            {gameType.replace('_', ' ')}
          </span>
          <h2 className="text-3xl font-bold">Party Room #402</h2>
        </div>

        {/* Players Orbit */}
        <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full animate-[spin_60s_linear_infinite]"></div>
          
          <div className="w-32 h-32 rounded-full bg-indigo-600/30 flex items-center justify-center relative z-10 shadow-2xl">
             <div className="text-4xl">🎲</div>
          </div>

          {INITIAL_PLAYERS.map((player, idx) => {
            const angle = (idx / INITIAL_PLAYERS.length) * 2 * Math.PI;
            const x = Math.cos(angle) * 160;
            const y = Math.sin(angle) * 160;
            return (
              <div 
                key={player.id} 
                className={`absolute text-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all`}
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                onClick={() => !player.isSelf && setSelectedPlayer(player)}
              >
                <div className={`relative w-16 h-16 rounded-2xl overflow-hidden mb-2 border-2 transition-all ${player.isSelf ? 'border-indigo-500' : 'border-white/20 hover:border-indigo-400 hover:scale-110'}`}>
                  <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                  {!player.isSelf && (
                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <span className="text-xl">🎁</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold truncate max-w-[80px]">{player.name}</p>
                {player.isAI && <span className="text-[10px] text-indigo-400 font-mono">AI</span>}
              </div>
            );
          })}
        </div>

        <div className="mt-12 w-full max-w-md">
           <button 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-transform"
            onClick={() => setGameState('playing')}
           >
             {gameState === 'intro' ? 'Start Game' : 'Continue'}
           </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-full lg:w-80 glass rounded-3xl flex flex-col border-white/10">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold">Room Chat</h3>
          <span className="text-xs text-slate-500">{messages.length} msgs</span>
        </div>

        <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-slate-500 italic text-sm">
              Say something to the group...
            </div>
          ) : (
            messages.map((msg) => {
              const sender = INITIAL_PLAYERS.find(p => p.id === msg.senderId);
              return (
                <div key={msg.id} className={`flex flex-col ${sender?.isSelf ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!sender?.isSelf && <span className="text-[10px] font-bold text-slate-400">{sender?.name}</span>}
                  </div>
                  <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] ${
                    sender?.isSelf 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white/10 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="flex gap-2 items-center text-slate-500 text-[10px] animate-pulse">
              <span>Gemini is typing...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
          <div className="relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-10"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Room;
