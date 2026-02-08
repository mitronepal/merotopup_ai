
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
    const userId = 'u_' + Date.now() + Math.random().toString(36).substr(2, 5);
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
    // Generate a high-entropy unique ID to prevent collisions among 100+ concurrent users
    const uniqueSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    const orderId = 'ORD-' + Date.now() + '-' + uniqueSuffix;
    
    const newOrder = {
      ...orderData,
      orderId,
      status: 'pending',
      timestamp: Date.now()
    };
    
    try {
      await fetch(`${DB_URL}/Orders/${orderId}.json`, {
        method: 'PUT',
        body: JSON.stringify(newOrder)
      });
      await this.triggerNotifications(newOrder as Order);
      return newOrder as Order;
    } catch (error) {
      console.error("Order Creation Error:", error);
      throw error;
    }
  }

  private async triggerNotifications(order: Order) {
    // Simulated admin alerting
    console.log(`[ALERT] NEW ORDER: ${order.orderId} for ${order.gameName} from ${order.customerName}`);
  }
}

export const firebaseService = new FirebaseService();
