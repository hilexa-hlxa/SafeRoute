import React, { useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';

const AlertOverlay = ({ onViewLocation }) => {
  const { alertData, dismissAlert } = useSocket();
  const audioRef = useRef(null);

  useEffect(() => {
    if (alertData) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
      audio.loop = true;
      audio.volume = 0.5;
      audioRef.current = audio;
      audio.play().catch((err) => {
        console.error('Failed to play audio:', err);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [alertData]);

  if (!alertData) return null;

  return (
    <div className="fixed inset-0 bg-red-600 animate-pulse z-50 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 animate-bounce">
          DANGER NEARBY
        </h1>
        <div className="space-y-4">
          <button
            onClick={() => {
              if (onViewLocation && alertData.lat && alertData.lng) {
                onViewLocation({ lat: alertData.lat, lng: alertData.lng });
              }
            }}
            className="bg-white text-red-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors text-lg"
          >
            VIEW LOCATION
          </button>
          <button
            onClick={dismissAlert}
            className="block w-full text-white font-medium py-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertOverlay;

