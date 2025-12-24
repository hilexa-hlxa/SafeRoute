import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';
import BottomNavBar from '../components/UI/BottomNavBar';

const ProfilePage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        city: user.city || '',
        password: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData = {
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        city: formData.city || null,
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }

      await axiosClient.patch('/users/me', updateData);
      setSuccess('Profile updated successfully!');
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-300 mb-6">Manage your account settings</p>

          {user && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">{user.email}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-4 backdrop-blur-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-4 rounded-xl mb-4 backdrop-blur-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-gray-200 mb-2">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-200 mb-2">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-gray-200 mb-2">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="New York"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                New Password (leave empty to keep current)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default ProfilePage;


