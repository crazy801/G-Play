
import React, { useState, useRef } from 'react';
import { UserProfile, GIFTS, Gift, Moment } from '../types';
import { GoogleGenAI } from "@google/genai";

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (profile: UserProfile) => void;
  onAdjustCoins: (amount: number) => boolean;
  onSendGift: (gift: Gift, recipientId: string, recipientName: string) => boolean;
  onBack: () => void;
  isOwnProfile?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onAdjustCoins, onSendGift, onBack, isOwnProfile = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'gifts' | 'moments' | 'studio'>('gifts');
  
  // Form State
  const [editForm, setEditForm] = useState({
    name: user.name,
    avatar: user.avatar,
    gender: user.gender || '',
    dob: user.dob || '',
    region: user.region || '',
    signature: user.signature || ''
  });

  // Moment Post State
  const [isPostingMoment, setIsPostingMoment] = useState(false);
  const [momentText, setMomentText] = useState('');
  const [momentImage, setMomentImage] = useState<string | null>(null);

  // AI Avatar State
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tempAIAvatar, setTempAIAvatar] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const momentImageRef = useRef<HTMLInputElement>(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    alert("ID copied to clipboard!");
  };

  const handleSaveProfile = () => {
    if (!editForm.name.trim()) {
      alert("Name cannot be empty");
      return;
    }
    onUpdateUser({ ...user, ...editForm });
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMomentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMomentImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostMoment = () => {
    if (!momentText.trim() && !momentImage) return;
    
    const newMoment: Moment = {
      id: Math.random().toString(36).substr(2, 9),
      text: momentText,
      image: momentImage || undefined,
      timestamp: Date.now()
    };

    const updatedMoments = [newMoment, ...(user.moments || [])];
    onUpdateUser({ ...user, moments: updatedMoments });
    
    setMomentText('');
    setMomentImage(null);
    setIsPostingMoment(false);
  };

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) return;
    if (!onAdjustCoins(-50)) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A futuristic, high-quality 3D social media avatar. Character description: ${avatarPrompt}. Vibrant colors, cinematic lighting.` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64 = `data:image/png;base64,${part.inlineData.data}`;
          setTempAIAvatar(base64);
          break;
        }
      }
    } catch (err) {
      console.error(err);
      onAdjustCoins(50);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToUser = (gift: Gift) => {
    onSendGift(gift, user.id, user.name);
    setShowGiftPanel(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Top Header Navigation */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-slate-500 hover:text-white flex items-center gap-2 transition-colors font-bold">
          ← Back
        </button>
        
        {!isOwnProfile && (
          <button 
            onClick={() => setShowGiftPanel(!showGiftPanel)} 
            className={`px-6 py-2.5 rounded-xl text-sm font-black shadow-lg transition-all flex items-center gap-2 active:scale-95 ${showGiftPanel ? 'bg-indigo-500 text-white' : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'}`}
          >
            <span>{showGiftPanel ? '✕' : '🎁'}</span> {showGiftPanel ? 'Cancel' : 'Send Gift'}
          </button>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && isOwnProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-8 md:p-12 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
            <button onClick={() => setIsEditing(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white text-2xl p-2 transition-colors">✕</button>
            <h2 className="text-3xl font-black mb-8 gradient-text">Edit Your Profile</h2>
            
            <div className="space-y-8">
              {/* Profile Pic Upload */}
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-indigo-500/50 cursor-pointer group relative shadow-2xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img src={editForm.avatar} className="w-full h-full object-cover group-hover:opacity-50 transition-all duration-300" alt="Preview" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/40">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Click to upload from gallery</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block ml-2">Username</label>
                  <input 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600" 
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block ml-2">User ID (Not Changable)</label>
                  <input 
                    value={user.id} 
                    disabled
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 font-bold opacity-40 cursor-not-allowed text-slate-400" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block ml-2">Gender</label>
                  <select 
                    value={editForm.gender} 
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  >
                    <option value="" className="bg-slate-900">Select Gender</option>
                    <option value="Male" className="bg-slate-900">Male</option>
                    <option value="Female" className="bg-slate-900">Female</option>
                    <option value="Non-binary" className="bg-slate-900">Non-binary</option>
                    <option value="Secret" className="bg-slate-900">Secret</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block ml-2">Date of Birth</label>
                  <input 
                    type="date"
                    value={editForm.dob} 
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white scheme-dark" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block ml-2">Region</label>
                <input 
                  value={editForm.region} 
                  onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} 
                  placeholder="e.g. London, UK"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700" 
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block ml-2">Signature (Bio)</label>
                <textarea 
                  value={editForm.signature} 
                  onChange={(e) => setEditForm({ ...editForm, signature: e.target.value })} 
                  placeholder="Share a thought or your social handle..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-medium min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none placeholder:text-slate-700" 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleSaveProfile} className="flex-grow bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.98]">Save Changes</button>
                <button onClick={() => setIsEditing(false)} className="px-8 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-bold transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gift Shop Panel */}
      {showGiftPanel && (
        <div className="mb-8 glass rounded-[2.5rem] p-8 border-rose-500/30 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
             <span className="text-9xl">🎁</span>
          </div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-rose-400">Gift Shop</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Surprise {user.name} with something special</p>
            </div>
            <button onClick={() => setShowGiftPanel(false)} className="text-slate-500 hover:text-white transition-colors text-2xl">✕</button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
            {GIFTS.map(gift => (
              <button 
                key={gift.id}
                onClick={() => handleSendToUser(gift)}
                className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-purple-500/0 group-hover:from-rose-500/10 group-hover:to-purple-500/10 transition-all"></div>
                <span className="text-5xl group-hover:scale-125 transition-transform relative z-10">{gift.icon}</span>
                <div className="text-center relative z-10">
                  <p className="text-xs font-bold text-slate-200 mb-1">{gift.name}</p>
                  <p className="text-sm font-black text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">{gift.cost} 🪙</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-[2rem] p-8 border-white/10 text-center shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/10 to-transparent"></div>
            
            {/* Edit Button in Top Right of Card */}
            {isOwnProfile && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all group z-20"
                title="Edit Profile"
              >
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            )}

            <div className="relative mx-auto w-32 h-32 mb-6 mt-4">
              <div className="w-full h-full rounded-[2rem] overflow-hidden border-2 border-indigo-500/50 relative z-10 bg-slate-800 shadow-2xl">
                <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-slate-900 z-20 shadow-lg"></div>
            </div>

            <div className="mb-4 relative z-10">
              <h2 className="text-3xl font-black mb-1">{user.name}</h2>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                {/* User ID Badge */}
                <div 
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/5 hover:border-indigo-500/50 cursor-pointer transition-all group"
                >
                  <span className="text-[10px] font-mono text-indigo-400 font-bold tracking-wider">{user.id}</span>
                  <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                
                {/* Charms System Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 rounded-full border border-pink-500/20 shadow-lg shadow-pink-500/5 group">
                  <span className="text-pink-500 text-sm group-hover:scale-125 transition-transform">✨</span>
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">{user.charms || 0} Charms</span>
                </div>
              </div>
              
              {user.signature && (
                <div className="relative px-6 py-4 mb-4 bg-white/5 rounded-2xl border border-white/5 italic text-sm text-slate-300">
                  <span className="absolute -top-2 left-4 text-indigo-500 text-3xl opacity-50 font-serif">“</span>
                  {user.signature}
                </div>
              )}
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-3 gap-2 py-6 border-y border-white/5 my-6">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Level</p>
                <p className="text-xl font-black text-indigo-400">{user.level}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Received</p>
                <p className="text-xl font-black text-amber-400">{user.giftsReceived}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Sent</p>
                <p className="text-xl font-black text-emerald-400">{user.giftsSent}</p>
              </div>
            </div>

            {/* ACTION AREA */}
            <div className="space-y-3 px-2">
                <button 
                  onClick={() => setShowGiftPanel(true)} 
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-black transition-all shadow-xl active:scale-95 group ${
                    isOwnProfile 
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' 
                    : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                  }`}
                >
                  <span className="text-xl group-hover:scale-125 transition-transform">🎁</span>
                  {isOwnProfile ? 'Send Gift' : 'Send Gift'}
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setActiveTab('gifts')}
                        className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all border ${activeTab === 'gifts' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <span className="text-xl mb-1">🏰</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Gift Wall</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('moments')}
                        className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all border ${activeTab === 'moments' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <span className="text-xl mb-1">✨</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Moments</span>
                    </button>
                </div>

                {!isOwnProfile && (
                    <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all text-slate-300">
                    Add Friend
                    </button>
                )}
            </div>

            <div className="mt-8 space-y-3 text-left">
              {user.gender && (
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</span>
                  <span className="font-bold text-slate-200">{user.gender}</span>
                </div>
              )}
              {user.dob && (
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Birthday</span>
                  <span className="font-bold text-slate-200">{new Date(user.dob).toLocaleDateString()}</span>
                </div>
              )}
              {user.region && (
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Region</span>
                  <span className="font-bold text-slate-200">{user.region}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {activeTab === 'gifts' && (
            <div className="glass rounded-[2.5rem] p-8 border-white/10 shadow-xl relative overflow-hidden group animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500/10 blur-[80px] rounded-full group-hover:bg-pink-500/20 transition-all duration-700"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center text-xl shadow-lg">🏰</div>
                    <div>
                    <h3 className="text-xl font-bold">Gift Wall</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{isOwnProfile ? 'Your Social Collection' : `${user.name}'s Collection`}</p>
                    </div>
                </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 relative z-10">
                {GIFTS.map(gift => {
                    const count = user.giftStats?.[gift.id] || 0;
                    return (
                    <div 
                        key={gift.id}
                        className={`relative p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center justify-center ${
                        count > 0 
                        ? 'bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border-indigo-500/20 scale-100 shadow-lg' 
                        : 'bg-white/5 border-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'
                        }`}
                    >
                        <span className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">{gift.icon}</span>
                        <span className="text-xs font-bold text-slate-300 mb-1">{gift.name}</span>
                        <div className="flex items-center gap-1">
                        <span className={`text-lg font-black ${count > 0 ? 'text-indigo-400' : 'text-slate-500'}`}>×{count}</span>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
          )}

          {activeTab === 'moments' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {isOwnProfile && (
                    <div className="glass rounded-[2.5rem] p-6 border-indigo-500/30 shadow-xl relative overflow-hidden group">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-indigo-500/30 flex-shrink-0">
                                <img src={user.avatar} className="w-full h-full object-cover" alt="Me" />
                            </div>
                            <div className="flex-grow">
                                <textarea 
                                    value={momentText}
                                    onChange={(e) => setMomentText(e.target.value)}
                                    placeholder="What's happening?"
                                    className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium resize-none min-h-[100px] placeholder:text-slate-600"
                                />
                                {momentImage && (
                                    <div className="relative mt-4 group/img inline-block">
                                        <img src={momentImage} className="max-h-[300px] rounded-2xl border border-white/10" alt="Moment Preview" />
                                        <button 
                                            onClick={() => setMomentImage(null)}
                                            className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-white/5 pt-4">
                            <button 
                                onClick={() => momentImageRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                            >
                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-xs font-bold text-slate-300">Image</span>
                                <input type="file" ref={momentImageRef} onChange={handleMomentImageChange} className="hidden" accept="image/*" />
                            </button>
                            <button 
                                onClick={handlePostMoment}
                                disabled={!momentText.trim() && !momentImage}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:grayscale transition-all px-8 py-2.5 rounded-xl font-black text-sm shadow-lg text-white"
                            >
                                Post
                            </button>
                        </div>
                    </div>
                )}

                {user.moments && user.moments.length > 0 ? (
                    user.moments.map((moment) => (
                        <div key={moment.id} className="glass rounded-[2.5rem] p-8 border-white/5 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-indigo-500/20 shadow-lg">
                                    <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-100">{user.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(moment.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <p className="text-lg text-slate-200 mb-6 leading-relaxed whitespace-pre-wrap">{moment.text}</p>
                            {moment.image && (
                                <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl mb-4 max-w-2xl mx-auto">
                                    <img src={moment.image} className="w-full object-cover max-h-[600px]" alt="Moment" />
                                </div>
                            )}
                            <div className="flex items-center gap-6 border-t border-white/5 pt-6 mt-6">
                                <button className="flex items-center gap-2 text-slate-500 hover:text-rose-500 transition-colors group">
                                    <span className="text-xl group-hover:scale-125 transition-transform">❤️</span>
                                    <span className="text-xs font-black">Like</span>
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors group">
                                    <span className="text-xl group-hover:scale-125 transition-transform">💬</span>
                                    <span className="text-xs font-black">Comment</span>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="glass rounded-[2.5rem] p-20 text-center border-white/5 opacity-40">
                        <span className="text-6xl block mb-6">📸</span>
                        <h3 className="text-xl font-bold mb-2">No Moments Yet</h3>
                        <p className="text-slate-400">Share your first social highlight with the world.</p>
                    </div>
                )}
            </div>
          )}

          {isOwnProfile && activeTab === 'studio' && (
            <div className="glass rounded-[2.5rem] p-8 border-white/10 relative overflow-hidden shadow-xl group animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-600/10 blur-[80px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-700"></div>
                
                <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-xl shadow-lg">✨</div>
                <div>
                    <h3 className="text-xl font-bold">AI Avatar Studio</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Generate 3D Personas</p>
                </div>
                </div>

                {tempAIAvatar ? (
                <div className="flex flex-col items-center gap-8 py-4 relative z-10 animate-in zoom-in duration-300">
                    <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20"></div>
                    <img src={tempAIAvatar} className="w-64 h-64 rounded-[3rem] border-4 border-indigo-500/50 shadow-2xl relative z-10 object-cover" alt="Generated" />
                    </div>
                    <div className="flex gap-4 w-full max-w-sm">
                    <button 
                        onClick={() => { onUpdateUser({ ...user, avatar: tempAIAvatar }); setTempAIAvatar(null); }} 
                        className="flex-grow py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-white shadow-lg transition-all"
                    >
                        Apply Look
                    </button>
                    <button 
                        onClick={() => setTempAIAvatar(null)} 
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-slate-300 transition-all"
                    >
                        Discard
                    </button>
                    </div>
                </div>
                ) : (
                <div className="space-y-6 relative z-10">
                    <textarea 
                    value={avatarPrompt}
                    onChange={(e) => setAvatarPrompt(e.target.value)}
                    placeholder="Describe your dream avatar... (e.g. A cyber-ninja with blue flames)"
                    className="w-full glass bg-white/5 rounded-2xl p-6 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-medium placeholder:text-slate-700 border-white/5"
                    />
                    <button 
                    onClick={handleGenerateAvatar} 
                    disabled={isGenerating || !avatarPrompt.trim()} 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-5 rounded-2xl font-black text-white shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:grayscale"
                    >
                    {isGenerating ? (
                        <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing with AI...
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-3">
                        <span>🪄</span> Generate New Avatar (50 Coins)
                        </div>
                    )}
                    </button>
                </div>
                )}
            </div>
          )}

          {/* AI Studio trigger (if not already visible) */}
          {isOwnProfile && activeTab !== 'studio' && (
              <div 
                onClick={() => setActiveTab('studio')}
                className="glass rounded-[2rem] p-6 border-white/10 hover:border-indigo-500/30 transition-all cursor-pointer group shadow-lg"
              >
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🪄</div>
                          <div>
                              <h4 className="font-bold">AI Avatar Studio</h4>
                              <p className="text-xs text-slate-400">Generate high-quality 3D personas with Gemini</p>
                          </div>
                      </div>
                      <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
