import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import IncidentMarker from './IncidentMarker';
import ReportModal from '../Forms/ReportModal';
import LocationButton from './LocationButton';
import RoutePlanner from './RoutePlanner';
import axiosClient from '../../api/axiosClient';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { useAuth } from '../../contexts/AuthContext';
import 'leaflet/dist/leaflet.css';

const MapEvents = ({ onMapClick, disabled }) => {
  useMapEvents({
    click: (e) => {
      if (!disabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const SafetyMap = ({ onZoomToAlert }) => {
  const [incidents, setIncidents] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCoords, setReportCoords] = useState({ lat: null, lng: null });
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]);
  const [mapZoom, setMapZoom] = useState(15);
  const [isRoutePlanning, setIsRoutePlanning] = useState(false);
  const location = useGeoLocation();
  const mapRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (location.lat && location.lng) {
      setMapCenter([location.lat, location.lng]);
      fetchIncidents(location.lat, location.lng);
    } else {
      // Load incidents for default location if geolocation not available
      fetchIncidents(mapCenter[0], mapCenter[1], 5000); // Larger radius for default location
    }
  }, [location.lat, location.lng]);

  // Initial load with default location
  useEffect(() => {
    const initialLat = location.lat || mapCenter[0];
    const initialLng = location.lng || mapCenter[1];
    fetchIncidents(initialLat, initialLng, 5000);
  }, []);

  useEffect(() => {
    if (onZoomToAlert) {
      const checkZoom = () => {
        if (onZoomToAlert.lat && onZoomToAlert.lng) {
          setMapCenter([onZoomToAlert.lat, onZoomToAlert.lng]);
          setMapZoom(18);
        }
      };
      checkZoom();
    }
  }, [onZoomToAlert]);

  const fetchIncidents = async (lat, lng, radius = 500) => {
    try {
      console.log('Fetching incidents for:', { lat, lng, radius });
      const response = await axiosClient.get('/incidents', {
        params: { lat, lng, radius },
      });
      console.log('Incidents received:', response.data);
      setIncidents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      console.error('Error details:', error.response?.data);
      setIncidents([]);
    }
  };

  const handleMapClick = (lat, lng) => {
    setReportCoords({ lat, lng });
    setReportModalOpen(true);
  };

  const handleMapMove = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      fetchIncidents(center.lat, center.lng);
    }
  };

  const handleReportSuccess = () => {
    if (location.lat && location.lng) {
      fetchIncidents(location.lat, location.lng);
    }
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
          mapInstance.on('moveend', handleMapMove);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onMapClick={handleMapClick} disabled={isRoutePlanning} />
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <LocationButton />
        <RoutePlanner 
          onRouteCalculated={(route) => {
            console.log('Route calculated:', route);
          }}
          onRouteCleared={() => {
            setIsRoutePlanning(false);
          }}
          onPlanningStateChange={(isPlanning) => {
            setIsRoutePlanning(isPlanning);
          }}
        />
        {incidents.length > 0 ? (
          incidents.map((incident) => (
            <IncidentMarker 
              key={incident.id} 
              incident={incident}
              onVote={handleReportSuccess}
              onResolve={handleReportSuccess}
            />
          ))
        ) : (
          <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/20 z-[1000]">
            <p className="text-sm">No incidents found in this area</p>
          </div>
        )}
      </MapContainer>
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        lat={reportCoords.lat}
        lng={reportCoords.lng}
        onSuccess={handleReportSuccess}
      />
    </div>
  );
};

export default SafetyMap;

