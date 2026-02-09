
import { User, Order, Game } from '../types';

const DB_URL = "https://merotopup-np-default-rtdb.firebaseio.com";
const NOTIFY_EMAIL = "bishaldigital55@gmail.com";

class FirebaseService {
  private async request(path: string, options: RequestInit = {}, retries = 3) {
    const url = `${DB_URL}/${path}.json`;
    let lastError: any;
    let backoff = 400;

    for (let i = 0; i < retries; i++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
        
        if (response.status === 401 || response.status === 403) {
          return { success: false, error: "PERMISSION_DENIED" };
        }
        throw new Error(`HTTP_${response.status}`);
      } catch (e: any) {
        clearTimeout(timeoutId);
        lastError = e;
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, backoff));
          backoff *= 2;
        }
      }
    }
    return { success: false, error: lastError?.message || "TIMEOUT" };
  }

  async getGames(): Promise<Record<string, Game>> {
    const res = await this.request('Games');
    return res.success ? (res.data || {}) : {};
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const res = await this.request('users');
    if (!res.success || !res.data) return null;
    
    const userEntry = Object.entries(res.data).find(([id, val]: [string, any]) => 
      val.email && val.email.toString().toLowerCase() === email.toLowerCase()
    );
    
    if (userEntry) {
      const [userId, userData] = userEntry;
      return { ...(userData as any), userId };
    }
    return null;
  }

  async getUserById(userId: string): Promise<User | null> {
    const res = await this.request(`users/${encodeURIComponent(userId)}`);
    return (res.success && res.data) ? { ...res.data, userId } : null;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const userId = 'u_' + Date.now();
    const newUser = {
      ...userData,
      userId,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: Date.now()
    };
    
    await this.request(`users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    
    return newUser as User;
  }

  /**
   * Robust Global Counter Implementation
   */
  async getNextOrderId(): Promise<string> {
    const res = await this.request('Orders/global_meta/counter');
    const currentCount = res.success ? (res.data || 0) : 0;
    const nextCount = currentCount + 1;
    
    // Immediate update to global meta
    await this.request('Orders/global_meta/counter', {
      method: 'PUT',
      body: JSON.stringify(nextCount)
    });

    return nextCount.toString().padStart(5, '0');
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const res = await this.request('Orders');
    if (!res.success || !res.data) return [];
    
    const orders: Order[] = [];
    Object.entries(res.data).forEach(([id, val]: [string, any]) => {
      if (id === 'global_meta') return;
      if (val.customerId === userId) {
        orders.push({ ...val, orderId: val.orderId || ('#' + id) });
      }
    });
    
    return orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  async createOrder(orderData: Partial<Order>): Promise<{ success: boolean; order: Order }> {
    const seqId = await this.getNextOrderId();
    const displayId = 'MT-' + seqId;
    
    const newOrder = {
      ...orderData,
      orderId: displayId,
      status: 'pending',
      timestamp: Date.now()
    } as Order;
    
    // Save order under MT-0000X path
    const res = await this.request(`Orders/${displayId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    });

    if (res.success) {
      if (orderData.customerId) {
        // Recalculate and sync user stats for 100% accuracy
        this.syncUserStats(orderData.customerId);
      }
      // Notify via email
      this.sendEmailNotification(newOrder);
    }

    return { success: res.success, order: newOrder };
  }

  private async syncUserStats(userId: string) {
    const orders = await this.getUserOrders(userId);
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.price || 0), 0);

    await this.request(`users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalOrders, totalSpent })
    });
  }

  private sendEmailNotification(order: Order) {
    // Ensuring email notification is sent reliably
    fetch("https://formspree.io/f/mnpkrrbz", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        subject: `New Order: ${order.orderId} (Rs. ${order.price})`,
        order_id: order.orderId,
        game: order.gameName,
        player_uid: order.gameUserId,
        player_ign: order.gameUsername,
        price: order.price,
        customer: order.customerName,
        email: order.customerEmail || 'No Email'
      })
    }).then(r => console.debug("Email status:", r.status))
      .catch(e => console.error("Email failed:", e));
  }
}

export const firebaseService = new FirebaseService();
