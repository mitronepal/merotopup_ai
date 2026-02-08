
import { User, Order, Game } from '../types';

const DB_URL = "https://merotopup-np-default-rtdb.firebaseio.com";
const ADMIN_EMAIL = "bishaldigital55@gmail.com";

class FirebaseService {
  async getGames(): Promise<Record<string, Game>> {
    try {
      const response = await fetch(`${DB_URL}/Games.json`);
      const data = await response.json();
      return data || {};
    } catch (e) { return {}; }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await fetch(`${DB_URL}/users.json`);
      const data = await response.json();
      if (!data) return null;
      const userId = Object.keys(data).find(id => data[id].email.toLowerCase() === email.toLowerCase());
      if (userId) return { ...data[userId], userId };
      return null;
    } catch (e) { return null; }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const response = await fetch(`${DB_URL}/users/${userId}.json`);
      const data = await response.json();
      return data ? { ...data, userId } : null;
    } catch (e) { return null; }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const userId = 'u_' + Math.random().toString(36).substr(2, 9);
    const newUser = {
      ...userData,
      userId,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: Date.now()
    };
    await fetch(`${DB_URL}/users/${userId}.json`, {
      method: 'PUT',
      body: JSON.stringify(newUser)
    });
    return newUser as User;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const response = await fetch(`${DB_URL}/Orders.json`);
      const data = await response.json();
      if (!data) return [];
      
      // Filter orders by customerId and sort by timestamp (newest first)
      const orders = Object.entries(data).map(([id, val]: [string, any]) => ({
        ...val,
        orderId: id
      })) as Order[];
      
      return orders
        .filter(o => o.customerId === userId)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) { return []; }
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const orderId = 'ORD' + Date.now();
    const newOrder = {
      ...orderData,
      orderId,
      status: 'pending',
      timestamp: Date.now()
    };
    
    // 1. Save to Firebase (Persistent Storage)
    await fetch(`${DB_URL}/Orders/${orderId}.json`, {
      method: 'PUT',
      body: JSON.stringify(newOrder)
    });
    
    // 2. Notify Admin and User (Logic Trigger)
    await this.triggerNotifications(newOrder as Order);
    
    return newOrder as Order;
  }

  private async triggerNotifications(order: Order) {
    console.log(`[SYSTEM] Triggering High-Priority Notifications...`);
    
    // Notification to ADMIN
    console.log(`[ADMIN EMAIL] To: ${ADMIN_EMAIL} | Subject: NEW ORDER ${order.orderId}`);
    console.log(`Content: User ${order.customerName} placed a ${order.price} Rs order for ${order.gameName}.`);

    // Notification to USER
    console.log(`[USER EMAIL] To: ${order.customerEmail || 'User'} | Subject: Order Pending`);
    
    // Real-world implementation would use EmailJS or a backend API here.
    // Example: await fetch('https://api.emailjs.com/api/v1.0/email/send', { ... })
  }
}

export const firebaseService = new FirebaseService();
