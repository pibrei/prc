import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { LogOut, Home, MapPin, Car, Users, Activity, Menu, X, ChevronDown, Key, FileText, Settings } from 'lucide-react'
import LocationPermissionBanner from '../location/LocationPermissionBanner'
import LocationErrorBanner from '../location/LocationErrorBanner'
import { supabase } from '../../lib/supabase'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userProfile, signOut } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As senhas não coincidem')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      
      if (error) throw error
      
      alert('Senha alterada com sucesso!')
      setShowPasswordModal(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      alert('Erro ao alterar senha: ' + error.message)
    }
  }

  const navigationItems = [
    { label: 'Dashboard', icon: Home, href: '/' },
    { label: 'Propriedades', icon: MapPin, href: '/properties' },
    { label: 'Veículos', icon: Car, href: '/vehicles' },
    { label: 'Mapa', icon: MapPin, href: '/map' },
  ]

  if (userProfile?.role === 'admin' || userProfile?.role === 'team_leader') {
    navigationItems.push(
      { label: 'Usuários', icon: Users, href: '/users' },
      { label: 'Auditoria', icon: Activity, href: '/audit' },
      { label: 'Relatórios', icon: FileText, href: '/reports' }
    )
  }

  if (userProfile?.role === 'admin') {
    navigationItems.push(
      { label: 'Configurações', icon: Settings, href: '/battalion-settings' }
    )
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              
              <h1 className="text-lg lg:text-xl font-semibold truncate">
                <span className="hidden sm:inline">Sistema de Patrulha Rural</span>
                <span className="sm:hidden">Patrulha Rural</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="relative" ref={userMenuRef}>
                <Button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  variant="ghost"
                  size="sm"
                  className="text-xs lg:text-sm"
                >
                  <span className="hidden sm:inline mr-2">{userProfile?.full_name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <button
                      onClick={() => {
                        setShowPasswordModal(true)
                        setUserMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Key className="h-4 w-4 inline mr-2" />
                      Alterar Senha
                    </button>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setUserMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 inline mr-2" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      location.pathname === item.href
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={closeMobileMenu}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`
          fixed top-16 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 lg:hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      location.pathname === item.href
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <LocationPermissionBanner />
          <LocationErrorBanner />
          {children}
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        <div className="flex justify-around py-2">
          {navigationItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center py-2 px-1 min-w-0 flex-1 ${
                location.pathname === item.href
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="lg:hidden h-16" />

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Alterar Senha
              </h3>
              <Button
                onClick={() => setShowPasswordModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nova Senha</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength={6}
                  placeholder="Digite sua nova senha"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Confirmar Nova Senha</label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  minLength={6}
                  placeholder="Digite novamente sua nova senha"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                >
                  Alterar Senha
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout