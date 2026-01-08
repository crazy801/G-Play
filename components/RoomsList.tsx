
import React from 'react';

interface RoomConfig {
  id: string;
  name: string;
  mode: string;
  tag: string;
  participants: number;
}

const MOCK_ROOMS: RoomConfig[] = [
  { id: 'R220701', name: 'Late Night Vibes 🌙', mode: 'Normal', tag: 'Chats', participants: 8 },
  { id: 'R220705', name: 'Music Jam Session 🎸', mode: 'Video', tag: 'Music', participants: 5 },
  { id: 'R220708', name: 'Gaming Zone 🎮', mode: 'Games', tag: 'Game', participants: 12 },
  { id: 'R220712', name: 'Best Friends Only 💖', mode: 'Normal', tag: 'Friends', participants: 3 },
  { id: 'R220715', name: 'K-Pop Party! 🎤', mode: 'Video', tag: 'Music', participants: 25 },
];

interface RoomsListProps {
  onJoinRoom: (config: any) => void;
}

const RoomsList: React.FC<RoomsListProps> = ({ onJoinRoom }) => {
  return (
    <div className="px-6 py-8 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black gradient-text">Live Rooms</h2>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Discover virtual spaces with real people</p>
        </div>
        <div className="flex gap-2">
            {['All', 'Music', 'Chats', 'Friends'].map(filter => (
                <button key={filter} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold hover:bg-white/10 transition-all">{filter}</button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_ROOMS.map(room => (
          <div 
            key={room.id}
            onClick={() => onJoinRoom(room)}
            className="glass p-6 rounded-[2.5rem] border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer shadow-lg hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xl shadow-indigo-500/5">
                    {room.tag === 'Music' ? '🎵' : room.tag === 'Game' ? '🎮' : '💬'}
                </div>
                <div>
                  <h4 className="font-black text-lg group-hover:text-indigo-300 transition-colors">{room.name}</h4>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full">{room.id}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex -space-x-3 overflow-hidden">
                    {[1,2,3].map(i => (
                        <img key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room.id}${i}`} alt="user" />
                    ))}
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-800 text-[10px] font-bold text-white ring-2 ring-slate-900">+{room.participants}</div>
                </div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Active Now</span>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4">
                <div className="flex gap-2">
                    <span className="text-[9px] font-black px-2.5 py-1 bg-white/5 rounded-lg uppercase text-slate-400 tracking-tighter">#{room.tag}</span>
                    <span className="text-[9px] font-black px-2.5 py-1 bg-white/5 rounded-lg uppercase text-slate-400 tracking-tighter">{room.mode} Mode</span>
                </div>
                <button className="text-indigo-400 font-black text-sm group-hover:translate-x-1 transition-transform">Join →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsList;
