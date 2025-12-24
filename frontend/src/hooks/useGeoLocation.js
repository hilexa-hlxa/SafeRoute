import { useState, useEffect } from 'react';

export const useGeoLocation = () => {
  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        lat: null,
        lng: null,
        loading: false,
        error: 'Geolocation is not supported by your browser',
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setLocation({
          lat: null,
          lng: null,
          loading: false,
          error: error.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return location;
};

