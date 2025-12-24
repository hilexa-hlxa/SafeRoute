import React from 'react';
import { useMap } from 'react-leaflet';
import { useGeoLocation } from '../../hooks/useGeoLocation';

const LocationButton = () => {
  const map = useMap();
  const location = useGeoLocation();

  const handleClick = () => {
    if (location.lat && location.lng) {
      map.setView([location.lat, location.lng], 16, {
        animate: true,
        duration: 1.0
      });
    } else {
      alert('Location not available. Please enable location permissions.');
    }
  };

  if (!location.lat || !location.lng) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="absolute top-4 right-4 z-[1000] bg-white/90 hover:bg-white backdrop-blur-md text-gray-800 p-3 rounded-xl shadow-lg border border-gray-200 transition-all transform hover:scale-110 active:scale-95"
      title="Go to my location"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  );
};

export default LocationButton;


