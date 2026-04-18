// src/hooks/useRealtimeUpdates.js
import { useEffect, useState } from 'react';

export const useRealtimeUpdates = (refreshFunction, eventNames) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Listen for real-time events and trigger refresh
    const handleRealtimeEvent = (event) => {
      console.log(`Real-time event received: ${event.type}`, event.detail);
      if (refreshFunction) {
        refreshFunction();
      }
    };

    // Add event listeners for all specified events
    eventNames.forEach(eventName => {
      window.addEventListener(eventName, handleRealtimeEvent);
    });

    // Check socket connection
    const checkConnection = () => {
      const socket = window.socket;
      setIsConnected(socket && socket.connected);
    };

    // Initial connection check
    checkConnection();

    // Listen for socket connection events
    window.addEventListener('socket_connected', checkConnection);
    window.addEventListener('socket_disconnected', () => setIsConnected(false));

    return () => {
      // Clean up event listeners
      eventNames.forEach(eventName => {
        window.removeEventListener(eventName, handleRealtimeEvent);
      });
      window.removeEventListener('socket_connected', checkConnection);
      window.removeEventListener('socket_disconnected', () => setIsConnected(false));
    };
  }, [refreshFunction, eventNames]);

  return isConnected;
};
