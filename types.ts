
export enum AppStep {
  AUTH = 'AUTH',
  IDLE = 'IDLE',
  PROCESS = 'PROCESS'
}

export interface User {
  userId: string;
  username: string;
  email: string;
  password?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: number;
}

export interface GamePackage {
  diamond?: number;
  uc?: number;
  price: number;
}

export interface Game {
  name: string;
  icon: string;
  [key: string]: any;
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  gameName: string;
  gameUserId: string;
  gameUsername: string;
  price: number;
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
  interactiveType?: 'AUTH_EMAIL' | 'AUTH_PASSWORD' | 'REGISTER_NAME' | 'GAME_INPUTS' | 'PAYMENT_METHODS' | 'UPLOAD_SCREENSHOT' | 'VIEW_ORDER_BTN';
  data?: any;
}
