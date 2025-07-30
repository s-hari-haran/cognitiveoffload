import type { WorkItem } from '@shared/schema';
import { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

// Extend the WebSocket type to include our custom properties
interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
}

export interface WebSocketMessage {
  type: 'work_item_created' | 'work_item_updated' | 'work_item_deleted' | 'sync_complete' | 'sync_progress';
  data?: any;
}

export class WorkOSWebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, ExtendedWebSocket> = new Map();
  private clientTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws'
    });

    // Add error handling for WebSocket server
    this.wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
      // Don't crash the entire application for WebSocket errors
      // Just log them and continue
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const extendedWs = ws as ExtendedWebSocket;
      this.clients.set(clientId, extendedWs);

      console.log(`🔌 WebSocket client connected: ${clientId}`);

      // Set up ping/pong for connection health monitoring
      extendedWs.isAlive = true;
      extendedWs.on('pong', () => {
        extendedWs.isAlive = true;
      });

      ws.on('message', (message) => {
        this.handleMessage(clientId, message);
      });

      ws.on('close', (code, reason) => {
        this.cleanupClient(clientId);
        console.log(`🔌 WebSocket client disconnected: ${clientId} (code: ${code}, reason: ${reason})`);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for client ${clientId}:`, error);
        this.cleanupClient(clientId);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'sync_complete',
        data: { message: 'Connected to WorkOS WebSocket' }
      });

      // Set up client timeout for inactivity
      const timeout = setTimeout(() => {
        console.log(`⏰ WebSocket client ${clientId} timed out due to inactivity`);
        this.cleanupClient(clientId);
        ws.terminate();
      }, 300000); // 5 minutes

      this.clientTimeouts.set(clientId, timeout);
    });

    // Set up heartbeat to detect stale connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const extendedWs = ws as ExtendedWebSocket;
        if (extendedWs.isAlive === false) {
          console.log('💀 Terminating stale WebSocket connection');
          return extendedWs.terminate();
        }

        extendedWs.isAlive = false;
        extendedWs.ping();
      });
    }, 30000); // 30 seconds

    console.log('✅ WebSocket server initialized on /ws');
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private cleanupClient(clientId: string): void {
    // Clear timeout
    const timeout = this.clientTimeouts.get(clientId);
    if (timeout) {
      clearTimeout(timeout);
      this.clientTimeouts.delete(clientId);
    }

    // Remove from clients map
    this.clients.delete(clientId);
  }

  private handleMessage(clientId: string, message: any) {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 WebSocket message from ${clientId}:`, data);
    } catch (error) {
      console.error(`❌ Invalid WebSocket message from ${clientId}:`, error);
    }
  }

  private sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (client && client.readyState === client.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error(`❌ Failed to send message to client ${clientId}:`, error);
        this.cleanupClient(clientId);
      }
    } else {
      // Remove disconnected clients
      this.cleanupClient(clientId);
    }
  }

  public broadcastWorkItemCreated(workItem: WorkItem) {
    const message: WebSocketMessage = {
      type: 'work_item_created',
      data: workItem
    };
    this.broadcast(message);
  }

  public broadcastWorkItemUpdated(workItem: WorkItem) {
    const message: WebSocketMessage = {
      type: 'work_item_updated',
      data: workItem
    };
    this.broadcast(message);
  }

  public broadcastWorkItemDeleted(workItemId: number) {
    const message: WebSocketMessage = {
      type: 'work_item_deleted',
      data: { id: workItemId }
    };
    this.broadcast(message);
  }

  public broadcastSyncComplete() {
    const message: WebSocketMessage = {
      type: 'sync_complete',
      data: { timestamp: new Date().toISOString() }
    };
    this.broadcast(message);
  }

  public broadcastSyncProgress(data: any) {
    const message: WebSocketMessage = {
      type: 'sync_progress',
      data
    };
    this.broadcast(message);
  }

  private broadcast(message: WebSocketMessage) {
    console.log(`📡 Broadcasting WebSocket message: ${message.type} to ${this.clients.size} clients`);

    const disconnectedClients: string[] = [];

    this.clients.forEach((client, clientId) => {
      if (client.readyState === client.OPEN) {
        try {
          client.send(JSON.stringify(message));
        } catch (error) {
          console.error(`❌ Failed to send message to client ${clientId}:`, error);
          disconnectedClients.push(clientId);
        }
      } else {
        // Mark for removal
        disconnectedClients.push(clientId);
      }
    });

    // Clean up disconnected clients
    disconnectedClients.forEach(clientId => {
      this.cleanupClient(clientId);
    });
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public destroy(): void {
    // Clean up heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Clean up all client timeouts
    this.clientTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.clientTimeouts.clear();

    // Close all client connections
    this.clients.forEach(client => {
      try {
        client.close();
      } catch (error) {
        console.error('Error closing WebSocket client:', error);
      }
    });
    this.clients.clear();

    // Close the WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    console.log('🔌 WebSocket service destroyed');
  }
}

let wsService: WorkOSWebSocketService | null = null;

export function initializeWebSocket(server: HttpServer) {
  wsService = new WorkOSWebSocketService(server);
  return wsService;
}

export function getWebSocketService(): WorkOSWebSocketService | null {
  return wsService;
}

// Cleanup on process exit
process.on('SIGTERM', () => {
  if (wsService) {
    wsService.destroy();
  }
});

process.on('SIGINT', () => {
  if (wsService) {
    wsService.destroy();
  }
});
