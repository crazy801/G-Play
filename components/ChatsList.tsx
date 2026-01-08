
import React from 'react';

interface ChatPreview {
  id: string;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
}

const MOCK_CHATS: ChatPreview[] = [
  { id: 'P482911', name: 'Felix', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', lastMsg: "See you in the room!", time: '2m ago', unread: 2 },
  { id: 'P482912', name: 'Aneka', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', lastMsg: "Sent you a rose! 🌹", time: '1h ago', unread: 0 },
  { id: 'P482913', name: 'Jasper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper', lastMsg: "Did you see that AI generate?", time: '3h ago', unread: 0 },
  { id: 'P482914', name: 'Milo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo', lastMsg: "Logic is key in Spy game.", time: 'Yesterday', unread: 0 },
  { id: 'P482915', name: 'Luna', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna', lastMsg: "Hey! Just joined.", time: 'Yesterday', unread: 5 },
];

interface ChatsListProps {
  onOpenChat: (profile: any) => void;
}

const ChatsList: React.FC<ChatsListProps> = ({ onOpenChat }) => {
  return (
    <div className="px-6 py-8 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black gradient-text">Messages</h2>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Your social connections</p>
        </div>
        <button className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-2xl shadow-xl shadow-indigo-500/5">➕</button>
      </div>

      <div className="space-y-4">
        {MOCK_CHATS.map(chat => (
          <div 
            key={chat.id}
            onClick={() => onOpenChat({ id: chat.id, name: chat.name, avatar: chat.avatar, level: 1, xp: 0, coins: 0, charms: 0, giftsSent: 0, giftsReceived: 0, giftStats: {} })}
            className="glass p-4 md:p-6 rounded-[2rem] border-white/5 hover:border-indigo-500/30 transition-all flex items-center gap-4 cursor-pointer group shadow-lg"
          >
            <div className="relative">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 border-indigo-500/20 shadow-xl group-hover:scale-105 transition-transform">
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-900 shadow-md"></div>
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-black text-lg truncate group-hover:text-indigo-400 transition-colors">{chat.name}</h4>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{chat.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-400 truncate pr-4">{chat.lastMsg}</p>
                {chat.unread > 0 && (
                  <span className="flex-shrink-0 bg-rose-600 text-[10px] font-black text-white px-2 py-1 rounded-full animate-bounce shadow-lg shadow-rose-600/20">{chat.unread}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center p-8 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 opacity-50">
          <span className="text-4xl block mb-3">💬</span>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Keep chatting to increase your Charms!</p>
      </div>
    </div>
  );
};

export default ChatsList;
