import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use useCallback to memoize fetching user data
  const fetchUser = useCallback(async () => {
    try {
      const hasToken = localStorage.getItem('token') || document.cookie.includes('auth_token');
      if (!hasToken) {
        setLoading(false);
        setUser(null);
        return; // Skip API call if definitely not logged in, avoiding 401 error
      }

      setLoading(true);
      setError(null);
      const { data } = await authAPI.me();
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUser(data.user);
    } catch (err) {
      setUser(null);
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const googleLogin = async (credential) => {
    try {
      const { data } = await authAPI.googleLogin(credential);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Do not block client-side logout if backend call fails.
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const isAdmin      = user?.role === 'admin';
  const isStudent    = user?.role === 'student';
  const isCaretaker  = user?.role === 'caretaker';
  const isWarden     = user?.role === 'warden';

  return (
    <AuthContext.Provider value={{ user, loading, error, login, googleLogin, logout, isAdmin, isStudent, isCaretaker, isWarden }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
