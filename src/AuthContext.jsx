import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, clearUser, getToken, getUser, setToken, setUser } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser());
  const [token, setTokenState] = useState(getToken());
  const [refreshing, setRefreshing] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!token) return;
    setRefreshing(true);
    api
      .me()
      .then((data) => {
        if (!data.user?.is_admin) {
          clearToken();
          clearUser();
          setTokenState(null);
          setUserState(null);
          return;
        }
        setUser(data.user);
        setUserState(data.user);
      })
      .catch(() => {
        // keep stored user if refresh fails
      })
      .finally(() => setRefreshing(false));
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (!data.user?.is_admin) {
      throw new Error('Admin access required. This account is not an administrator.');
    }
    setToken(data.token);
    setUser(data.user);
    setTokenState(data.token);
    setUserState(data.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    clearToken();
    clearUser();
    setTokenState(null);
    setUserState(null);
  };

  const updateProfile = async (payload) => {
    const data = await api.updateProfile(payload);
    setUser(data.user);
    setUserState(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      refreshing,
      isAuthenticated: Boolean(token),
      login,
      logout,
      updateProfile,
    }),
    [user, token, refreshing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
