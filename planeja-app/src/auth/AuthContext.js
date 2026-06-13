import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { clearAccessToken, setAccessToken } from './tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const { data } = await api.post('/auth/refresh');
        if (!active) return;
        setAccessToken(data.token);
        setUser({ nome: data.nome, email: data.email });
        setIsAuthenticated(true);
      } catch {
        if (active) {
          clearAccessToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const setSession = useCallback((authData) => {
    setAccessToken(authData.token);
    setUser({ nome: authData.nome, email: authData.email });
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignora falha remota */
    }
    clearAccessToken();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated, setSession, logout }),
    [user, loading, isAuthenticated, setSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

export default AuthContext;
