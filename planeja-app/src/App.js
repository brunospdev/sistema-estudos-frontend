import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Painel from './pages/Painel';
import Perfil from './pages/Perfil';
import Calendario from './pages/Calendario';
import Marcos from './pages/Marcos';
import './App.css';

function RotaProtegida({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Carregando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route
        path="/"
        element={
          <RotaProtegida>
            <Painel />
          </RotaProtegida>
        }
      />
      <Route
        path="/perfil"
        element={
          <RotaProtegida>
            <Perfil />
          </RotaProtegida>
        }
      />
      <Route
        path="/calendario"
        element={
          <RotaProtegida>
            <Calendario />
          </RotaProtegida>
        }
      />
      <Route
        path="/marcos"
        element={
          <RotaProtegida>
            <Marcos />
          </RotaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
