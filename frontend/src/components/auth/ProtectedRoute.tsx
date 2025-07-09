import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoginPage from './LoginPage'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'standard_user' | 'team_leader' | 'admin'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, userProfile, loading, initializing } = useAuth()

  // Show loading screen during initial app load
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  // Show loading during auth operations (login/logout)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Processando...</div>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return <LoginPage />
  }

  if (requiredRole) {
    const roleHierarchy = {
      'standard_user': 1,
      'team_leader': 2,
      'admin': 3
    }

    const userRoleLevel = roleHierarchy[userProfile.role]
    const requiredRoleLevel = roleHierarchy[requiredRole]

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg text-red-500">
            Acesso negado. Você não tem permissão para acessar esta página.
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

export default ProtectedRoute