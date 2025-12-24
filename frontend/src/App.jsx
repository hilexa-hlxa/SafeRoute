import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import SafetyMap from './components/Map/SafetyMap';
import SOSButton from './components/UI/SOSButton';
import AlertOverlay from './components/UI/AlertOverlay';
import LoginForm from './components/Forms/LoginForm';
import RegisterForm from './components/Forms/RegisterForm';
import AdminPanel from './components/Admin/AdminPanel';
import ProfilePage from './pages/ProfilePage';
import BottomNavBar from './components/UI/BottomNavBar';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const MainApp = () => {
  const [zoomToAlert, setZoomToAlert] = useState(null);

  const handleViewLocation = (coords) => {
    setZoomToAlert(coords);
    setTimeout(() => setZoomToAlert(null), 100);
  };

  return (
    <div className="relative w-full h-screen pb-16">
      <SafetyMap onZoomToAlert={zoomToAlert} />
      <SOSButton />
      <AlertOverlay onViewLocation={handleViewLocation} />
      <BottomNavBar />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <MainApp />
                </SocketProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

