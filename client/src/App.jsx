import { useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Login, Register } from './pages/Auth';
import { Trips } from './pages/Trips';
import { TripNew, TripEdit } from './pages/TripForm';
import { TripDetail } from './pages/TripDetail';
import { Bookings } from './pages/Bookings';
import { NotFound } from './pages/NotFound';

/**
 * Sends an already signed-in visitor away from the auth pages. The decision is
 * taken once, at mount, so that signing in on the page itself does not race
 * the form's own redirect (e.g. register -> /trips/new).
 */
function GuestOnly({ children }) {
  const { user } = useAuth();
  const wasSignedIn = useRef(Boolean(user));
  return wasSignedIn.current ? <Navigate to="/trips" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="explore" element={<Explore />} />
              <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
              <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
              <Route path="trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
              <Route path="trips/new" element={<ProtectedRoute><TripNew /></ProtectedRoute>} />
              <Route path="trips/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
              <Route path="trips/:id/edit" element={<ProtectedRoute><TripEdit /></ProtectedRoute>} />
              <Route path="bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
