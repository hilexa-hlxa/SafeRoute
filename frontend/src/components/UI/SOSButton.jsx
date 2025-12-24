import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import axiosClient from '../../api/axiosClient';

const SOSButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const pressTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const { sendSOS } = useSocket();
  const location = useGeoLocation();

  const HOLD_DURATION = 1500;

  useEffect(() => {
    if (isPressed) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / (HOLD_DURATION / 50));
          if (newProgress >= 100) {
            return 100;
          }
          return newProgress;
        });
      }, 50);

      pressTimerRef.current = setTimeout(async () => {
        if (location.lat && location.lng) {
          try {
            await axiosClient.post('/sos', { lat: location.lat, lng: location.lng });
            sendSOS(location.lat, location.lng);
          } catch (error) {
            console.error('Failed to send SOS:', error);
            alert('Failed to send SOS signal');
          }
        }
        setIsPressed(false);
        setProgress(0);
      }, HOLD_DURATION);
    } else {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
    }

    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPressed, sendSOS, location.lat, location.lng]);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    setProgress(0);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsPressed(true);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsPressed(false);
    setProgress(0);
  };

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[9999]">
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 rounded-full shadow-2xl flex items-center justify-center text-white font-bold text-xl focus:outline-none focus:ring-4 focus:ring-red-400/50 transition-all transform hover:scale-110 active:scale-95 ${
          isPressed ? 'scale-95 shadow-red-500/50' : ''
        } ${!location.lat || !location.lng ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={!location.lat || !location.lng}
      >
        <span className="z-10 drop-shadow-lg">SOS</span>
        {isPressed && (
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="5"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="white"
              strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-50"
            />
          </svg>
        )}
        {!isPressed && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
        )}
      </button>
    </div>
  );
};

export default SOSButton;

