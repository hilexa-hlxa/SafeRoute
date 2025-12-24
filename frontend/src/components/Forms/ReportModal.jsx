import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const ReportModal = ({ isOpen, onClose, lat, lng, onSuccess }) => {
  const [type, setType] = useState('no_light');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const incidentTypes = [
    { value: 'no_light', label: 'No Light' },
    { value: 'aggressive_animal', label: 'Aggressive Animal' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'ice', label: 'Ice' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axiosClient.post('/incidents', {
        lat,
        lng,
        type,
        description: description || null,
      });
      onSuccess();
      onClose();
      setDescription('');
      setType('no_light');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to report incident');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 border border-white/20 shadow-2xl animate-slideUp">
        <h2 className="text-2xl font-bold text-white mb-2">Report Incident</h2>
        <p className="text-gray-300 text-sm mb-6">Help keep others safe</p>
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 backdrop-blur-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-gray-200 mb-2">
              Incident Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              {incidentTypes.map((it) => (
                <option key={it.value} value={it.value}>
                  {it.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-200 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              placeholder="Add more details..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;

