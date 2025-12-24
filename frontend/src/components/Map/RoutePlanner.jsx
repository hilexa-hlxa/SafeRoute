import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import axiosClient from '../../api/axiosClient';
import { useGeoLocation } from '../../hooks/useGeoLocation';

// Custom icons for route markers
const startIcon = L.divIcon({
  className: 'custom-route-marker',
  html: `<div style="
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
  ">A</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const endIcon = L.divIcon({
  className: 'custom-route-marker',
  html: `<div style="
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
  ">B</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const RoutePlanner = ({ onRouteCalculated, onRouteCleared, onPlanningStateChange }) => {
  const [isPlanning, setIsPlanning] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const map = useMap();
  const location = useGeoLocation();

  // Notify parent about planning state
  useEffect(() => {
    if (onPlanningStateChange) {
      onPlanningStateChange(isPlanning);
    }
  }, [isPlanning, onPlanningStateChange]);

  // Enable route planning mode
  const startPlanning = () => {
    setIsPlanning(true);
    setStartPoint(null);
    setEndPoint(null);
    setRoute(null);
    setError(null);
    
    // Set start point to current location if available
    if (location.lat && location.lng) {
      setStartPoint({ lat: location.lat, lng: location.lng });
    }
  };

  // Cancel planning
  const cancelPlanning = () => {
    setIsPlanning(false);
    setStartPoint(null);
    setEndPoint(null);
    setRoute(null);
    setError(null);
    if (onRouteCleared) onRouteCleared();
  };

  // Handle map click to set points (only when planning)
  useEffect(() => {
    if (!isPlanning) return;

    const handleClick = (e) => {
      e.originalEvent?.stopPropagation?.();
      const { lat, lng } = e.latlng;
      
      if (!startPoint) {
        setStartPoint({ lat, lng });
      } else if (!endPoint) {
        setEndPoint({ lat, lng });
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isPlanning, startPoint, endPoint, map]);

  // Calculate route when both points are set
  useEffect(() => {
    if (startPoint && endPoint && isPlanning) {
      calculateRoute();
    }
  }, [startPoint, endPoint, isPlanning]);

  const calculateRoute = async () => {
    if (!startPoint || !endPoint) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosClient.post('/routes/safe-route', {
        start_lat: startPoint.lat,
        start_lng: startPoint.lng,
        end_lat: endPoint.lat,
        end_lng: endPoint.lng,
        avoid_radius: 100, // 100 meters avoidance radius
      });

      if (response.data && response.data.geometry && response.data.geometry.length > 0) {
        setRoute(response.data);
        if (onRouteCalculated) onRouteCalculated(response.data);
      } else {
        setError('No route found');
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setError(err.response?.data?.detail || 'Failed to calculate route');
    } finally {
      setLoading(false);
    }
  };

  // Route line color
  const routeColor = route ? '#3b82f6' : '#9ca3af';

  return (
    <>
      {/* Control Button */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {!isPlanning ? (
          <button
            onClick={startPlanning}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Plan Route
          </button>
        ) : (
          <>
            <button
              onClick={cancelPlanning}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm transition-all transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            {loading && (
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm text-gray-700">
                Calculating route...
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg text-sm max-w-xs">
                {error}
              </div>
            )}
            {route && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg shadow-lg text-sm">
                Route: {(route.distance || 0).toFixed(2)} km, {Math.round((route.duration || 0) / 60)} min
                {route.incidents_avoided > 0 && (
                  <div className="text-xs mt-1">Avoided {route.incidents_avoided} incident(s)</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Instructions */}
      {isPlanning && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm text-gray-700 font-semibold mb-1">
            {!startPoint ? 'Click on map to set start point (A)' : 
             !endPoint ? 'Click on map to set end point (B)' : 
             'Route calculated!'}
          </p>
          {startPoint && !endPoint && (
            <p className="text-xs text-gray-500">Start point set at your location</p>
          )}
        </div>
      )}

      {/* Route Markers */}
      {startPoint && (
        <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon} />
      )}
      {endPoint && (
        <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon} />
      )}

      {/* Route Line */}
      {route && route.geometry && route.geometry.length > 0 && (
        <Polyline
          positions={route.geometry}
          pathOptions={{
            color: routeColor,
            weight: 5,
            opacity: 0.8,
            dashArray: '10, 10',
          }}
        />
      )}
    </>
  );
};

export default RoutePlanner;

