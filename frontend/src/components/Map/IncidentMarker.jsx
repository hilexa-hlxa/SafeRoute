import React, { useState, useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const getMarkerColor = (type) => {
  const colors = {
    no_light: 'orange',
    aggressive_animal: 'red',
    harassment: 'purple',
    ice: 'blue',
    other: 'gray',
  };
  return colors[type] || 'gray';
};

const getMarkerIconUrl = (type) => {
  const color = getMarkerColor(type);
  const colorMap = {
    orange: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    red: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    purple: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    blue: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    gray: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  };
  return colorMap[color] || colorMap.gray;
};

// Create a highly visible marker
const createCustomMarker = (iconUrl, size, isNew) => {
  const markerSize = isNew ? [50, 75] : [40, 60]; // Much larger markers
  
  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div style="
        position: relative;
        width: ${markerSize[0]}px;
        height: ${markerSize[1]}px;
      ">
        <img 
          src="${iconUrl}" 
          style="
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.4)) brightness(1.1) saturate(1.3);
          "
          alt="incident marker"
        />
        ${isNew ? `
          <div style="
            position: absolute;
            top: -10px;
            right: -10px;
            background: #ef4444;
            color: white;
            font-size: 11px;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 12px;
            box-shadow: 0 3px 10px rgba(239, 68, 68, 0.8);
            border: 3px solid white;
            z-index: 1000;
            white-space: nowrap;
          ">NEW</div>
        ` : ''}
      </div>
    `,
    iconSize: markerSize,
    iconAnchor: [markerSize[0] / 2, markerSize[1]],
    popupAnchor: [0, -markerSize[1]],
  });
};

const IncidentMarker = ({ incident, onVote, onResolve }) => {
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);

  // Check if incident is new (created within last 24 hours)
  const isNew = () => {
    const createdAt = new Date(incident.created_at);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  const getTypeLabel = (type) => {
    const labels = {
      no_light: 'No Light',
      aggressive_animal: 'Aggressive Animal',
      harassment: 'Harassment',
      ice: 'Ice',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const handleVote = async (isTruthful) => {
    if (voting) return;
    setVoting(true);
    try {
      await axiosClient.post(`/incidents/${incident.id}/vote`, { is_truthful: isTruthful });
      if (onVote) onVote();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const handleResolve = async () => {
    if (!confirm('Mark this incident as resolved?')) return;
    try {
      await axiosClient.patch(`/incidents/${incident.id}/resolve`);
      if (onResolve) onResolve();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to resolve');
    }
  };

  // Use custom marker for maximum visibility
  const iconUrl = getMarkerIconUrl(incident.type);
  const customIcon = createCustomMarker(iconUrl, [40, 60], isNew());

  return (
    <Marker 
      position={[incident.lat, incident.lng]} 
      icon={customIcon}
      zIndexOffset={isNew() ? 1000 : 0}
    >
      <Popup className="custom-popup">
        <div className="p-4 min-w-[240px] bg-white/95 backdrop-blur-sm rounded-xl shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-base text-gray-900">{getTypeLabel(incident.type)}</h3>
            {isNew() && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                NEW
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              incident.status === 'active' ? 'bg-green-100 text-green-700' :
              incident.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {incident.status}
            </span>
          </div>
          {incident.description && (
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">{incident.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-600 mb-3 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-1">
              <span className="text-green-600 font-semibold">✓</span>
              <span>{incident.confirm_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-red-600 font-semibold">✗</span>
              <span>{incident.reject_count}</span>
            </div>
            <span className="text-gray-400">{new Date(incident.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => handleVote(true)}
              disabled={voting}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95"
            >
              ✓ Confirm
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={voting}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95"
            >
              ✗ Reject
            </button>
          </div>
          {(user?.id === incident.user_id || user?.role === 'admin') && incident.status === 'active' && (
            <button
              onClick={handleResolve}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all transform hover:scale-105 active:scale-95"
            >
              Mark Resolved
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default IncidentMarker;

