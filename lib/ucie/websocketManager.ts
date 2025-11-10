/**
 * WebSocket Manager for Real-Time UCIE Data
 * 
 * Provides real-time price updates, order book changes, and market events
 * using WebSocket connections to multiple exchanges.
 * 
 * Features:
 * - Multi-exchange WebSocket connections
 * - Automatic reconnection with exponential backoff
 * - Message aggregation and deduplication
 * - Subscription management
 * - Connection health monitoring
 * - Battery-aware updates (mobile)
 */

export interface WebSocketConfig {
  exchange: string;
  url: string;
  subscribeMessage: (symbol: string) => any;
  parseMessage: (data: any) => MarketUpdate | null;
  heartbeatInterval?: number;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface MarketUpdate {
  exchange: string;
  symbol: string;
  type: 'price' | 'orderbook' | 'trade' | 'ticker';
  timestamp: number;
  data: any;
}

export interface Subscription {
  symbol: string;
  exchanges: string[];
  callback: (update: MarketUpdate) => void;
}

/**
 * WebSocket configurations for major exchanges
 */
const EXCHANGE_CONFIGS: Record<string, WebSocketConfig> = {
  'binance': {
    exchange: 'binance',
    url: 'wss://stream.binance.com:9443/ws',
    subscribeMessage: (symbol) => ({
      method: 'SUBSCRIBE',
      params: [`${symbol.toLowerCase()}usdt@ticker`],
      id: Date.now()
    }),
    parseMessage: (data) => {
      if (data.e === '24hrTicker') {
        return {
          exchange: 'binance',
          symbol: data.s.replace('USDT', ''),
          type: 'ticker',
          timestamp: data.E,
          data: {
            price: parseFloat(data.c),
            volume24h: parseFloat(data.v),
            change24h: parseFloat(data.P),
            high24h: parseFloat(data.h),
            low24h: parseFloat(data.l)
          }
        };
      }
      return null;
    },
    heartbeatInterval: 30000,
    reconnectDelay: 1000,
    maxReconnectAttempts: 10
  },
  
  'kraken': {
    exchange: 'kraken',
    url: 'wss://ws.kraken.com',
    subscribeMessage: (symbol) => ({
      event: 'subscribe',
      pair: [`${symbol}/USD`],
      subscription: { name: 'ticker' }
    }),
    parseMessage: (data) => {
      if (Array.isArray(data) && data[2] === 'ticker') {
        const ticker = data[1];
        return {
          exchange: 'kraken',
          symbol: data[3].split('/')[0],
          type: 'ticker',
          timestamp: Date.now(),
          data: {
            price: parseFloat(ticker.c[0]),
            volume24h: parseFloat(ticker.v[1]),
            high24h: parseFloat(ticker.h[1]),
            low24h: parseFloat(ticker.l[1])
          }
        };
      }
      return null;
    },
    heartbeatInterval: 30000,
    reconnectDelay: 1000,
    maxReconnectAttempts: 10
  },
  
  'coinbase': {
    exchange: 'coinbase',
    url: 'wss://ws-feed.exchange.coinbase.com',
    subscribeMessage: (symbol) => ({
      type: 'subscribe',
      product_ids: [`${symbol}-USD`],
      channels: ['ticker']
    }),
    parseMessage: (data) => {
      if (data.type === 'ticker') {
        return {
          exchange: 'coinbase',
          symbol: data.product_id.split('-')[0],
          type: 'ticker',
          timestamp: new Date(data.time).getTime(),
          data: {
            price: parseFloat(data.price),
            volume24h: parseFloat(data.volume_24h),
            high24h: parseFloat(data.high_24h),
            low24h: parseFloat(data.low_24h)
          }
        };
      }
      return null;
    },
    heartbeatInterval: 30000,
    reconnectDelay: 1000,
    maxReconnectAttempts: 10
  }
};

/**
 * WebSocket Manager Class
 */
export class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private messageBuffer: MarketUpdate[] = [];
  private bufferFlushInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = true;
  
  constructor() {
    // Start buffer flush interval (aggregate updates every 100ms)
    this.bufferFlushInterval = setInterval(() => {
      this.flushMessageBuffer();
    }, 100);
    
    // Handle page visibility changes (pause when hidden)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pause();
        } else {
          this.resume();
        }
      });
    }
    
    // Handle battery status (reduce updates on low battery)
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2) {
            console.log('🔋 Low battery detected, reducing WebSocket update frequency');
            // Reduce update frequency by increasing buffer flush interval
            if (this.bufferFlushInterval) {
              clearInterval(this.bufferFlushInterval);
              this.bufferFlushInterval = setInterval(() => {
                this.flushMessageBuffer();
              }, 500); // 500ms instead of 100ms
            }
          }
        });
      });
    }
  }
  
  /**
   * Subscribe to real-time updates for a symbol
   */
  subscribe(symbol: string, exchanges: string[], callback: (update: MarketUpdate) => void): void {
    const subscriptionKey = `${symbol}-${exchanges.join(',')}`;
    
    // Store subscription
    this.subscriptions.set(subscriptionKey, {
      symbol,
      exchanges,
      callback
    });
    
    // Connect to each exchange
    exchanges.forEach(exchange => {
      this.connectToExchange(exchange, symbol);
    });
    
    console.log(`📡 Subscribed to ${symbol} on ${exchanges.join(', ')}`);
  }
  
  /**
   * Unsubscribe from updates
   */
  unsubscribe(symbol: string, exchanges: string[]): void {
    const subscriptionKey = `${symbol}-${exchanges.join(',')}`;
    this.subscriptions.delete(subscriptionKey);
    
    // Close connections if no other subscriptions need them
    exchanges.forEach(exchange => {
      const connectionKey = `${exchange}-${symbol}`;
      const hasOtherSubscriptions = Array.from(this.subscriptions.values()).some(
        sub => sub.symbol === symbol && sub.exchanges.includes(exchange)
      );
      
      if (!hasOtherSubscriptions) {
        this.closeConnection(connectionKey);
      }
    });
    
    console.log(`📡 Unsubscribed from ${symbol} on ${exchanges.join(', ')}`);
  }
  
  /**
   * Connect to an exchange WebSocket
   */
  private connectToExchange(exchange: string, symbol: string): void {
    const config = EXCHANGE_CONFIGS[exchange];
    if (!config) {
      console.error(`❌ Unknown exchange: ${exchange}`);
      return;
    }
    
    const connectionKey = `${exchange}-${symbol}`;
    
    // Don't reconnect if already connected
    if (this.connections.has(connectionKey)) {
      return;
    }
    
    try {
      const ws = new WebSocket(config.url);
      
      ws.onopen = () => {
        console.log(`✅ Connected to ${exchange} WebSocket`);
        
        // Reset reconnect attempts
        this.reconnectAttempts.set(connectionKey, 0);
        
        // Send subscription message
        const subscribeMsg = config.subscribeMessage(symbol);
        ws.send(JSON.stringify(subscribeMsg));
        
        // Start heartbeat
        if (config.heartbeatInterval) {
          const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ event: 'ping' }));
            }
          }, config.heartbeatInterval);
          
          this.heartbeatTimers.set(connectionKey, heartbeat);
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const update = config.parseMessage(data);
          
          if (update) {
            // Add to buffer for aggregation
            this.messageBuffer.push(update);
          }
        } catch (error) {
          console.error(`❌ Failed to parse ${exchange} message:`, error);
        }
      };
      
      ws.onerror = (error) => {
        console.error(`❌ ${exchange} WebSocket error:`, error);
      };
      
      ws.onclose = () => {
        console.log(`🔌 ${exchange} WebSocket closed`);
        
        // Clean up
        this.connections.delete(connectionKey);
        const heartbeat = this.heartbeatTimers.get(connectionKey);
        if (heartbeat) {
          clearInterval(heartbeat);
          this.heartbeatTimers.delete(connectionKey);
        }
        
        // Attempt reconnection
        this.scheduleReconnect(exchange, symbol, config);
      };
      
      this.connections.set(connectionKey, ws);
      
    } catch (error) {
      console.error(`❌ Failed to connect to ${exchange}:`, error);
      this.scheduleReconnect(exchange, symbol, config);
    }
  }
  
  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(exchange: string, symbol: string, config: WebSocketConfig): void {
    const connectionKey = `${exchange}-${symbol}`;
    const attempts = this.reconnectAttempts.get(connectionKey) || 0;
    
    if (attempts >= (config.maxReconnectAttempts || 10)) {
      console.error(`❌ Max reconnect attempts reached for ${exchange}`);
      return;
    }
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s (max)
    const delay = Math.min(
      (config.reconnectDelay || 1000) * Math.pow(2, attempts),
      60000
    );
    
    console.log(`🔄 Reconnecting to ${exchange} in ${delay}ms (attempt ${attempts + 1})`);
    
    const timer = setTimeout(() => {
      this.reconnectAttempts.set(connectionKey, attempts + 1);
      this.connectToExchange(exchange, symbol);
    }, delay);
    
    this.reconnectTimers.set(connectionKey, timer);
  }
  
  /**
   * Close a connection
   */
  private closeConnection(connectionKey: string): void {
    const ws = this.connections.get(connectionKey);
    if (ws) {
      ws.close();
      this.connections.delete(connectionKey);
    }
    
    const heartbeat = this.heartbeatTimers.get(connectionKey);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.heartbeatTimers.delete(connectionKey);
    }
    
    const reconnectTimer = this.reconnectTimers.get(connectionKey);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      this.reconnectTimers.delete(connectionKey);
    }
  }
  
  /**
   * Flush message buffer and notify subscribers
   */
  private flushMessageBuffer(): void {
    if (this.messageBuffer.length === 0 || !this.isActive) return;
    
    // Group updates by symbol
    const updatesBySymbol = new Map<string, MarketUpdate[]>();
    
    this.messageBuffer.forEach(update => {
      const existing = updatesBySymbol.get(update.symbol) || [];
      existing.push(update);
      updatesBySymbol.set(update.symbol, existing);
    });
    
    // Notify subscribers with aggregated updates
    updatesBySymbol.forEach((updates, symbol) => {
      // Find matching subscriptions
      this.subscriptions.forEach(subscription => {
        if (subscription.symbol === symbol) {
          // Send most recent update from each exchange
          const latestByExchange = new Map<string, MarketUpdate>();
          
          updates.forEach(update => {
            const existing = latestByExchange.get(update.exchange);
            if (!existing || update.timestamp > existing.timestamp) {
              latestByExchange.set(update.exchange, update);
            }
          });
          
          // Notify with each exchange's latest update
          latestByExchange.forEach(update => {
            subscription.callback(update);
          });
        }
      });
    });
    
    // Clear buffer
    this.messageBuffer = [];
  }
  
  /**
   * Pause all connections (when page is hidden)
   */
  pause(): void {
    this.isActive = false;
    console.log('⏸️ WebSocket manager paused');
  }
  
  /**
   * Resume all connections (when page is visible)
   */
  resume(): void {
    this.isActive = true;
    console.log('▶️ WebSocket manager resumed');
  }
  
  /**
   * Close all connections and clean up
   */
  destroy(): void {
    console.log('🛑 Destroying WebSocket manager');
    
    // Close all connections
    this.connections.forEach((ws, key) => {
      this.closeConnection(key);
    });
    
    // Clear buffer flush interval
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }
    
    // Clear all data
    this.connections.clear();
    this.subscriptions.clear();
    this.reconnectAttempts.clear();
    this.reconnectTimers.clear();
    this.heartbeatTimers.clear();
    this.messageBuffer = [];
  }
  
  /**
   * Get connection status
   */
  getStatus(): {
    activeConnections: number;
    activeSubscriptions: number;
    bufferedMessages: number;
    isActive: boolean;
  } {
    return {
      activeConnections: this.connections.size,
      activeSubscriptions: this.subscriptions.size,
      bufferedMessages: this.messageBuffer.length,
      isActive: this.isActive
    };
  }
}

/**
 * Singleton instance
 */
let wsManager: WebSocketManager | null = null;

/**
 * Get WebSocket manager instance
 */
export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

/**
 * Clean up WebSocket manager
 */
export function destroyWebSocketManager(): void {
  if (wsManager) {
    wsManager.destroy();
    wsManager = null;
  }
}
