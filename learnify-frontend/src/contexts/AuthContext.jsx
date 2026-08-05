import { createContext, useEffect, useMemo, useState } from 'react';
import { getStoredToken, getStoredUser, saveAuthTokens, clearAuthTokens } from '../utils/tokenUtils';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();
    if (storedUser) setUser(storedUser);
    if (storedToken) setToken(storedToken);
  }, []);

  const signIn = (authData) => {
    const accessToken = authData.access_token || authData.token;
    const refreshToken = authData.refresh_token;
    const nextUser = authData.user || { name: authData.name || 'Student', role: authData.role || 'student' };
    saveAuthTokens({ accessToken, refreshToken, user: nextUser });
    setToken(accessToken);
    setUser(nextUser);
  };

  const signOut = () => {
    clearAuthTokens();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, signIn, signOut, isAuthenticated: Boolean(token) }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
