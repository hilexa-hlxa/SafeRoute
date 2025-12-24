import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import BottomNavBar from '../UI/BottomNavBar';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('incidents');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, statusFilter]);

  const fetchData = async () => {
    try {
      if (activeTab === 'incidents') {
        const params = statusFilter ? { status: statusFilter } : {};
        const response = await axiosClient.get('/admin/incidents', { params });
        setIncidents(response.data);
      } else {
        const response = await axiosClient.get('/admin/users');
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axiosClient.patch(`/admin/incidents/${id}/approve`);
      fetchData();
    } catch (error) {
      alert('Failed to approve incident');
    }
  };

  const handleReject = async (id) => {
    try {
      await axiosClient.patch(`/admin/incidents/${id}/reject`);
      fetchData();
    } catch (error) {
      alert('Failed to reject incident');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axiosClient.delete(`/admin/users/${id}`);
      fetchData();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-gray-300">Manage incidents and users</p>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => { setActiveTab('incidents'); setLoading(true); }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'incidents' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/50' 
                : 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20'
            }`}
          >
            Incidents
          </button>
          <button
            onClick={() => { setActiveTab('users'); setLoading(true); }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'users' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/50' 
                : 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20'
            }`}
          >
            Users
          </button>
        </div>

        {activeTab === 'incidents' && (
          <div>
            <div className="mb-6">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-300">Loading...</div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex gap-2 items-center mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            incident.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50' :
                            incident.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/50' :
                            incident.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
                            'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                          }`}>
                            {incident.status}
                          </span>
                          <span className="text-sm text-gray-300 font-medium capitalize">{incident.type.replace('_', ' ')}</span>
                        </div>
                        {incident.description && (
                          <p className="text-sm text-gray-200 mb-3 leading-relaxed">{incident.description}</p>
                        )}
                        <div className="flex gap-4 text-xs text-gray-400 mb-2">
                          <span>📍 {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}</span>
                          <span>✓ {incident.confirm_count} ✗ {incident.reject_count}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(incident.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {incident.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(incident.id)}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(incident.id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <div className="text-center py-12 text-gray-400 bg-white/5 rounded-xl border border-white/10">
                    No incidents found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-gray-300">Loading...</div>
            ) : (
              <div className="space-y-4">
                {users.map((u) => (
                  <div key={u.id} className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-between items-center">
                    <div>
                      <div className="flex gap-2 items-center mb-2">
                        <span className="font-semibold text-white">{u.email}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'admin' 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' 
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      {u.full_name && <p className="text-sm text-gray-200 mb-1">{u.full_name}</p>}
                      <div className="flex gap-4 text-xs text-gray-400">
                        {u.phone && <span>📞 {u.phone}</span>}
                        {u.city && <span>📍 {u.city}</span>}
                      </div>
                    </div>
                    {u.role !== 'admin' && u.id !== user.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg ml-4"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-12 text-gray-400 bg-white/5 rounded-xl border border-white/10">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};

export default AdminPanel;

