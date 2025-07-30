import { toast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: 'work_item_created' | 'work_item_updated' | 'work_item_deleted' | 'sync_complete' | 'sync_progress';
  data?: any;
}

export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second

  const connect = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Fix the host detection - use window.location.hostname and port
    const hostname = window.location.hostname || 'localhost';
    const port = window.location.port || '5000';
    const host = `${hostname}:${port}`;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log('🔌 Attempting WebSocket connection to:', wsUrl);

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        console.log('✅ WebSocket connected successfully');

        // Clear any existing reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);

          // Handle different message types
          switch (message.type) {
            case 'work_item_created':
              toast({
                title: 'New item added',
                description: 'A new work item has been processed'
              });
              break;
            case 'work_item_updated':
              toast({
                title: 'Item updated',
                description: 'A work item has been updated'
              });
              break;
            case 'sync_progress':
              // Handle real-time sync progress updates
              console.log('📊 Sync progress:', message.data);
              if (message.data?.status === 'created') {
                toast({
                  title: 'Email processed',
                  description: message.data.message || 'Email analyzed and added to dashboard',
                  duration: 2000
                });
              } else if (message.data?.status === 'skipped') {
                console.log('⏭️ Email skipped:', message.data.message);
              } else if (message.data?.status === 'error') {
                console.warn('❌ Email processing error:', message.data.message);
              }
              break;
            case 'sync_complete':
              console.log('Sync completed');
              break;
          }

          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        setIsConnected(false);
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);

        // Only attempt to reconnect if it wasn't a clean close and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current); // Exponential backoff
          console.log(`🔄 Attempting to reconnect WebSocket in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('❌ Max WebSocket reconnection attempts reached');
          toast({
            title: 'Connection lost',
            description: 'Unable to reconnect to server. Please refresh the page.',
            variant: 'destructive'
          });
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      // Clean up reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close WebSocket connection
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
        ws.current = null;
      }

      // Reset state
      setIsConnected(false);
      reconnectAttemptsRef.current = 0;
    };
  }, []);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Failed to send WebSocket message:', error);
      }
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  };

  const reconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  };

  return { isConnected, sendMessage, reconnect };
}
