import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/useAuthStore'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import AvailabilityPage from './pages/AvailabilityPage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import ArchivePage from './pages/ArchivePage'
import PlaceDetailPage from './pages/PlaceDetailPage'
import TripRecordDetailPage from './pages/TripRecordDetailPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { fetchMe } = useAuthStore()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:tripId" element={<TripDetailPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/archive/places/:placeId" element={<PlaceDetailPage />} />
        <Route path="/archive/trips/:tripId" element={<TripRecordDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/availability" replace />} />
    </Routes>
  )
}
