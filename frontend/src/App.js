import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PublicView from "@/pages/PublicView";
import AccessSelection from "@/pages/AccessSelection";
import Register from "@/pages/Register";
import SubscriptionExpired from "@/pages/SubscriptionExpired";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Axios interceptor to add token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      setIsAuthenticated(true);
      
      // Verificar expiração da assinatura (apenas para empresas)
      if (response.data.role !== 'super_admin' && response.data.company) {
        checkSubscriptionExpiration(response.data.company);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionExpiration = (company) => {
    if (!company.subscription_expires_at) return;
    
    const expirationDate = new Date(company.subscription_expires_at);
    const now = new Date();
    
    // Se expirou e não estamos na página de assinatura expirada
    if (expirationDate < now && window.location.pathname !== '/subscription-expired') {
      window.location.href = '/subscription-expired';
    }
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Visualização Pública - Acesso via link direto sem senha */}
          <Route 
            path="/public/:company_code" 
            element={<PublicView />} 
          />
          
          {/* Registro de Nova Empresa */}
          <Route 
            path="/register" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Register />
            } 
          />
          
          {/* Página de Seleção de Acesso */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <AccessSelection />
            } 
          />
          
          {/* Login com modo (empresa ou admin) */}
          <Route 
            path="/login/:mode" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Login onLogin={handleLogin} />
            } 
          />
          
          {/* Rota antiga de login redireciona para seleção */}
          <Route 
            path="/login" 
            element={<Navigate to="/" replace />} 
          />
          
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/" replace />
            } 
          />
          
          {/* Assinatura Expirada */}
          <Route 
            path="/subscription-expired" 
            element={<SubscriptionExpired company={user?.company} onPaymentSuccess={() => window.location.reload()} />} 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
