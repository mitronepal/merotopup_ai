
export enum AppStep {
  AUTH = 'AUTH',
  IDLE = 'IDLE',
  PROCESS = 'PROCESS'
}

export interface User {
  userId: string;
  username: string;
  email: string;
  balance?: number;
  spent?: number;
  password?: string;
}

export interface GamePackage {
  diamond?: number;
  uc?: number;
  price: number;
}

export interface Game {
  name: string;
  icon: string;
  [key: string]: any; // For dynamic package keys like ff_115
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  // customerEmail added to fix property missing error in services/firebaseService.ts and App.tsx
  customerEmail?: string;
  gameId: string;
  gameName: string;
  gameUserId: string;
  gameUsername: string;
  // diamondCount made optional as it is not always relevant for all game top-ups (e.g. UC)
  diamondCount?: number;
  price: number;
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: number;
  paymentMethod?: string;
  screenshot?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
  interactiveType?: 'AUTH_EMAIL' | 'AUTH_PASSWORD' | 'REGISTER_NAME' | 'GAME_INPUTS' | 'PAYMENT_METHODS' | 'UPLOAD_SCREENSHOT';
  data?: any;
}
