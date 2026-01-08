
export enum GameType {
  WHO_IS_SPY = 'WHO_IS_SPY',
  VOICE_LOUNGE = 'VOICE_LOUNGE',
  DRAW_GUESS = 'DRAW_GUESS',
  AI_AVATAR = 'AI_AVATAR'
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
  isSelf?: boolean;
}

export interface Moment {
  id: string;
  text: string;
  image?: string;
  timestamp: number;
}

export interface UserProfile {
  id: string; // Unique ID like P-XXXXXX
  name: string;
  avatar: string;
  level: number;
  xp: number;
  coins: number;
  giftsReceived: number;
  giftsSent: number;
  charms: number;
  giftStats: Record<string, number>; // Maps gift ID to count received
  moments?: Moment[];
  gender?: string;
  dob?: string;
  region?: string;
  signature?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface GameRoom {
  id: string;
  type: GameType;
  title: string;
  players: Player[];
  status: 'lobby' | 'playing' | 'ended';
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  xpValue: number;
}

export const GIFTS: Gift[] = [
  { id: 'rose', name: 'Rose', icon: '🌹', cost: 5, xpValue: 5 },
  { id: 'heart', name: 'Heart', icon: '❤️', cost: 10, xpValue: 10 },
  { id: 'crown', name: 'Crown', icon: '👑', cost: 50, xpValue: 50 },
  { id: 'diamond', name: 'Diamond', icon: '💎', cost: 100, xpValue: 250 },
  { id: 'rocket', name: 'Rocket', icon: '🚀', cost: 150, xpValue: 600 },
];
