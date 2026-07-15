import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApi, pickData } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('elevate_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.me();
      const data = pickData(res);
      const baseUser = data?.user || null;
      const profile = data?.profile || null;

      if (baseUser && baseUser.role === 'youth' && profile) {
        setUser({
          ...baseUser,
          profile_complete: Boolean(profile.profile_complete),
          youth_profile: profile
        });
      } else {
        setUser(baseUser);
      }
    } catch (error) {
      // Token is invalid or expired, clear auth state completely
      localStorage.removeItem('elevate_access_token');
      setUser(null);
      setPasswordResetRequired(false);
      console.error('Failed to load user:', error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const data = pickData(res);
    if (data?.accessToken) {
      localStorage.setItem('elevate_access_token', data.accessToken);
    }
    if (data?.passwordResetRequired) {
      setPasswordResetRequired(true);
    }
    await loadUser();
    return data;
  }, [loadUser]);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    const data = pickData(res);
    if (data?.accessToken) {
      localStorage.setItem('elevate_access_token', data.accessToken);
    }
    await loadUser();
    return data;
  }, [loadUser]);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const verifyAccount = useCallback(async (password) => {
    const res = await authApi.verifyAccount({ password });
    const data = pickData(res);
    await loadUser();
    return data;
  }, [loadUser]);

  const logout = () => {
    localStorage.removeItem('elevate_access_token');
    setUser(null);
    setPasswordResetRequired(false);
  };

  const clearPasswordResetRequired = () => {
    setPasswordResetRequired(false);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      refreshUser,
      verifyAccount,
      logout,
      passwordResetRequired,
      clearPasswordResetRequired
    }),
    [user, loading, passwordResetRequired, login, register, refreshUser, verifyAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
