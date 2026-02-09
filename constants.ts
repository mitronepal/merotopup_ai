
import { Game } from './types';

export const SYSTEM_INSTRUCTION = `
You are "MeroTopup AI", a professional and efficient digital salesman for Nepal's leading game store.

CORE PERSONA:
1. **Professional Identity**: Always identify as MeroTopup AI. Only mention the creator "Bishal Ghimire" if explicitly asked "Who created you?".
2. **Concise & Helpful**: Be direct and polite. Use a mix of Nepali and English (Romanized Nepali).
3. **Professional Support**: If an error occurs, guide users to: "सपोर्ट टिमलाई ९७६४६३०६३४ मा सम्पर्क गर्नुहोस्।"

STRICT BUSINESS RULES:
1. **Screenshot Verification**: Only accept successful payment screenshots. Do not ask for Transaction IDs in text.
2. **Remark Instruction**: Before providing payment details, say: "कृपया पेमेन्ट गर्दा Remark मा आफ्नो Game ID (UID) अनिवार्य लेख्नुहोला।"
3. **Login First**: Always require login [ACTION: REQUIRE_LOGIN] before asking for game details or showing payment methods.
4. **Order Status**: After a successful order, reassure: "तपाईंको अर्डर सुरक्षित भयो। १ देखि ५ मिनेटभित्र चेक गरेर सफल (Complete) गरिनेछ।"

CORE ACTION TAGS:
- Login Needed: [ACTION: REQUIRE_LOGIN]
- Asking Details: [PRICE: X] [ACTION: ASK_GAME_DETAILS]
- Payment Options: [PRICE: X] [ACTION: SHOW_PAYMENT_METHODS]
- Upload Button: [PRICE: X] [ACTION: SHOW_SCREENSHOT_UPLOAD]
- View Order Button: [ACTION: SHOW_ORDER_BUTTON]
`;

export const GAMES: Record<string, Game> = {
  freefire: {
    gameId: 'freefire',
    name: 'Free Fire',
    icon: '💎',
    packages: {
      pkg1: { packageId: 'pkg1', diamonds: 100, price: 100, description: '100 Diamonds' },
      pkg2: { packageId: 'pkg2', diamonds: 310, price: 300, description: '310 Diamonds' },
      pkg3: { packageId: 'pkg3', diamonds: 520, price: 500, description: '520 Diamonds' },
      pkg4: { packageId: 'pkg4', diamonds: 1060, price: 1000, description: '1060 Diamonds' }
    }
  },
  pubgmobile: {
    gameId: 'pubgmobile',
    name: 'PUBG Mobile',
    icon: '⚡',
    packages: {
      pkg1: { packageId: 'pkg1', uc: 60, price: 100, description: '60 UC' },
      pkg2: { packageId: 'pkg2', uc: 325, price: 500, description: '325 UC' },
      pkg3: { packageId: 'pkg3', uc: 660, price: 1000, description: '660 UC' }
    }
  }
};

export const PAYMENT_METHODS = {
  esewa: {
    name: 'eSewa',
    id: '9861513184',
    merchantName: 'Bishal Ghimire',
    icon: '/esewa_icon.png',
    qr: '/esewa_qr.png',
    color: '#60bb46'
  },
  khalti: {
    name: 'Khalti',
    id: '9861513184',
    merchantName: 'Bishal Ghimire',
    icon: '/khalti_icon.png',
    qr: '/khalti_qr.png',
    color: '#5c2d91'
  },
  imepay: {
    name: 'IME Pay',
    id: '9861513184',
    merchantName: 'Bishal Ghimire',
    icon: '/imepay_icon.png',
    qr: '/imepay_qr.png',
    color: '#ed1c24'
  },
  banking: {
    name: 'Banking (ADBL)',
    id: '0228202511791016',
    merchantName: 'BISHAL GHIMIRE',
    icon: '/banking_icon.png',
    qr: '/banking_qr.png',
    color: '#1e40af'
  }
};
