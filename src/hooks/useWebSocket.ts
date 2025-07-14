import { useCallback, useRef, useEffect } from 'react';
import { backendAPI } from '../services/backendAPI';

interface UseWebSocketOptions {
  gameId: string; // gameId maintenant requis
  onMessage: (message: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export const useWebSocket = ({
  gameId,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectAttempts = 5,
  reconnectDelay = 3000,
}: UseWebSocketOptions) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectCountRef = useRef(0);
  const isConnectingRef = useRef(false);
  const shouldConnectRef = useRef(true);
  const pingIntervalRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      
      if (wsRef.current.readyState === WebSocket.OPEN || 
          wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      
      wsRef.current = null;
    }
    
    isConnectingRef.current = false;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket not connected, message not sent:', message);
    return false;
  }, []);

  const startPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    pingIntervalRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: 'ping',
          data: {}
        });
      }
    }, 30000); // Ping toutes les 30 secondes
  }, [sendMessage]);

  const connect = useCallback(() => {
    if (!shouldConnectRef.current || isConnectingRef.current || !gameId || gameId === "") {
      return;
    }

    // Nettoyer la connexion existante
    cleanup();

    try {
      isConnectingRef.current = true;
      console.log(`🔌 Connecting WebSocket - Game: ${gameId}`);
      
      wsRef.current = backendAPI.createWebSocket(gameId);

      wsRef.current.onopen = () => {
        console.log(`✅ WebSocket connected - Game: ${gameId}`);
        isConnectingRef.current = false;
        reconnectCountRef.current = 0;
        startPing();
        onOpen?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Gérer les messages pong automatiquement
          if (message.type === 'pong') {
            console.log('Pong reçu');
            return;
          }
          
          onMessage(message);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`❌ WebSocket closed - Game: ${gameId}, Code: ${event.code}`);
        isConnectingRef.current = false;
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        onClose?.();

        // Reconnexion automatique si nécessaire
        if (shouldConnectRef.current && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          console.log(`🔄 Tentative de reconnexion ${reconnectCountRef.current}/${reconnectAttempts}`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`💥 WebSocket error - Game: ${gameId}:`, error);
        isConnectingRef.current = false;
        onError?.(error);
      };

    } catch (error) {
      console.error('Erreur création WebSocket:', error);
      isConnectingRef.current = false;
    }
  }, [gameId, onMessage, onOpen, onClose, onError, reconnectAttempts, reconnectDelay, cleanup, startPing]);

  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;
    cleanup();
  }, [cleanup]);

  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    shouldConnectRef.current = true;
    connect();
  }, [connect]);

  useEffect(() => {
    if (gameId && gameId !== "") {
      shouldConnectRef.current = true;
      connect();
    }

    return () => {
      shouldConnectRef.current = false;
      cleanup();
    };
  }, [gameId, connect, cleanup]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
    reconnect,
    disconnect,
  };
};
