import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GeolocationProvider } from './contexts/GeolocationContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import PropertyImport from './pages/PropertyImport'
import PropertyImportBatch from './pages/PropertyImportBatch'
import PropertyImportSingle from './pages/PropertyImportSingle'
import Vehicles from './pages/Vehicles'
import Map from './pages/Map'
import Users from './pages/Users'
import AuditLogs from './pages/AuditLogs'
import Reports from './pages/Reports'
import BattalionSettings from './pages/BattalionSettings'
import Register from './pages/Register'
import ContactPage from './pages/ContactPage'
import Tools from './pages/Tools'

function App() {
  return (
    <AuthProvider>
      <GeolocationProvider>
        <Router>
          <Routes>
          {/* Rotas públicas */}
          <Route path="/register" element={<Register />} />
          <Route path="/contato/:slug" element={<ContactPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/properties" element={
            <ProtectedRoute>
              <Layout>
                <Properties />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/properties/import" element={
            <ProtectedRoute requiredRole="team_leader">
              <Layout>
                <PropertyImport />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/properties/import-batch" element={
            <ProtectedRoute requiredRole="team_leader">
              <Layout>
                <PropertyImportBatch />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/properties/import-single" element={
            <ProtectedRoute requiredRole="team_leader">
              <Layout>
                <PropertyImportSingle />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/vehicles" element={
            <ProtectedRoute>
              <Layout>
                <Vehicles />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/map" element={
            <ProtectedRoute>
              <Layout>
                <Map />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/audit" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AuditLogs />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute requiredRole="team_leader">
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/battalion-settings" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <BattalionSettings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tools" element={
            <ProtectedRoute>
              <Layout>
                <Tools />
              </Layout>
            </ProtectedRoute>
          } />
          </Routes>
        </Router>
      </GeolocationProvider>
    </AuthProvider>
  )
}

export default App
