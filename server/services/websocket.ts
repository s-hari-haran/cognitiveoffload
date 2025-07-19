import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import type { WorkItem } from '@shared/schema';

export interface WebSocketMessage {
  type: 'work_item_created' | 'work_item_updated' | 'work_item_deleted' | 'sync_complete';
  data?: any;
}

export class WorkOSWebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      console.log(`WebSocket client connected: ${clientId}`);

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'sync_complete',
        data: { message: 'Connected to WorkOS WebSocket' }
      });
    });
  }

  private generateClientId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private handleMessage(clientId: string, message: any) {
    console.log(`Received message from ${clientId}:`, message);
    // Handle incoming messages from clients if needed
  }

  private sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  public broadcastWorkItemCreated(workItem: WorkItem) {
    this.broadcast({
      type: 'work_item_created',
      data: workItem
    });
  }

  public broadcastWorkItemUpdated(workItem: WorkItem) {
    this.broadcast({
      type: 'work_item_updated',
      data: workItem
    });
  }

  public broadcastWorkItemDeleted(workItemId: number) {
    this.broadcast({
      type: 'work_item_deleted',
      data: { id: workItemId }
    });
  }

  public broadcastSyncComplete() {
    this.broadcast({
      type: 'sync_complete',
      data: { timestamp: new Date().toISOString() }
    });
  }

  private broadcast(message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      } else {
        this.clients.delete(clientId);
      }
    });
  }
}

export let wsService: WorkOSWebSocketService | null = null;

export function initializeWebSocket(server: Server) {
  wsService = new WorkOSWebSocketService(server);
  return wsService;
}
