import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { FilterProvider } from '@/contexts/FilterContext';
import { RealTimeProvider } from '@/contexts/RealTimeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DataProvider } from '@/contexts/DataContext';
import { Toaster } from 'sonner';
import { AIChatbot } from '@/components/AIChatbot';
import { initializeApp } from '@/utils/initializeApp';
import ProtectedRoute from '@/components/ProtectedRoute';
import authService from '@/services/authService';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Upload from '@/pages/Upload';
import CSVUploader from '@/pages/CSVUploader';
import Settings from '@/pages/Settings';
import States from '@/pages/States';
import Regions from '@/pages/Regions';
import Stores from '@/pages/Stores';
import Drivers from '@/pages/Drivers';
import Alerts from '@/pages/Alerts';
import DataDiagnostic from '@/pages/DataDiagnostic';
import NotFound from '@/pages/NotFound';
import './App.css';

function App() {
  useEffect(() => {
    // Clear authentication on app load to ensure login page shows first
    // This ensures users must log in each time they visit the app
    const clearAuthOnLoad = () => {
      // Check if this is a fresh app load (not a page navigation)
      const isAppFreshLoad = !sessionStorage.getItem('app-loaded');

      if (isAppFreshLoad) {
        // Clear authentication data to force login
        localStorage.removeItem('auth-token');
        localStorage.removeItem('current-user');

        // Mark that app has loaded in this session
        sessionStorage.setItem('app-loaded', 'true');
      }
    };

    clearAuthOnLoad();

    // Initialize app with API key and system configuration
    initializeApp();
  }, []);

  return (
    <ThemeProvider>
      <RealTimeProvider>
        <FilterProvider>
          <DataProvider>
            <Router>
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Default redirect to login */}
                <Route
                  path="/"
                  element={
                    authService.isAuthenticated() ? (
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />

                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Upload />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/csv-upload"
                  element={
                    <ProtectedRoute>
                      <CSVUploader />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/states"
                  element={
                    <ProtectedRoute>
                      <States />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/regions"
                  element={
                    <ProtectedRoute>
                      <Regions />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/stores"
                  element={
                    <ProtectedRoute>
                      <Stores />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/drivers"
                  element={
                    <ProtectedRoute>
                      <Drivers />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <Alerts />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/diagnostic"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <DataDiagnostic />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/unauthorized"
                  element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                        <h1 className="text-3xl font-bold mb-4 text-gray-900">
                          Unauthorized Access
                        </h1>
                        <p className="text-gray-600 mb-6">
                          You don't have permission to access this page.
                        </p>
                        <a
                          href="/"
                          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Return to Dashboard
                        </a>
                      </div>
                    </div>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>

              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={3000}
              />

              {/* Only show chatbot for authenticated users */}
              {authService.isAuthenticated() && <AIChatbot />}
            </Router>
          </DataProvider>
        </FilterProvider>
      </RealTimeProvider>
    </ThemeProvider>
  );
}

export default App;
