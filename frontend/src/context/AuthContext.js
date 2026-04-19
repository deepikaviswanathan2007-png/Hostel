import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);
const AUTH_BOOTSTRAP_TIMEOUT_MS = 5000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use useCallback to memoize fetching user data
  const fetchUser = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AUTH_BOOTSTRAP_TIMEOUT_MS);

    try {
      const hasToken = localStorage.getItem('token') || document.cookie.includes('auth_token');
      if (!hasToken) {
        setLoading(false);
        setUser(null);
        return; // Skip API call if definitely not logged in, avoiding 401 error
      }

      setLoading(true);
      setError(null);
      const { data } = await authAPI.me({ signal: controller.signal });
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUser(data.user);
    } catch (err) {
      setUser(null);
      if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
        setError(err?.response?.data?.message || err.message);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const handleAuthInvalidated = () => {
      setUser(null);
      setError(null);
      setLoading(false);
    };

    window.addEventListener('auth:invalidated', handleAuthInvalidated);
    return () => window.removeEventListener('auth:invalidated', handleAuthInvalidated);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      await authAPI.getCsrfToken();
      const { data } = await authAPI.login({ email, password });
      if (data.accessToken || data.token) {
        localStorage.setItem('token', data.accessToken || data.token);
      }
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  }, []);

  const googleLogin = useCallback(async (credential) => {
    try {
      await authAPI.getCsrfToken();
      const { data } = await authAPI.googleLogin(credential);
      if (data.accessToken || data.token) {
        localStorage.setItem('token', data.accessToken || data.token);
      }
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Do not block client-side logout if backend call fails.
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    googleLogin,
    logout,
    isAdmin:     user?.role === 'admin',
    isStudent:   user?.role === 'student',
    isCaretaker: user?.role === 'caretaker',
    isWarden:    user?.role === 'warden',
  }), [user, loading, error, login, googleLogin, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);