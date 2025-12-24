import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [alertActive, setAlertActive] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const newSocket = io(API_URL, {
        auth: {
          token: `Bearer ${token}`,
        },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      newSocket.on('emergency_alert', (data) => {
        console.log('Emergency alert received:', data);
        setAlertData(data);
        setAlertActive(true);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  const sendSOS = (lat, lng) => {
    if (socket && socket.connected) {
      socket.emit('sos_signal', { lat, lng });
    }
  };

  const dismissAlert = () => {
    setAlertActive(false);
    setAlertData(null);
  };

  const value = {
    socket,
    alertActive,
    alertData,
    sendSOS,
    dismissAlert,
    setAlertActive,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

