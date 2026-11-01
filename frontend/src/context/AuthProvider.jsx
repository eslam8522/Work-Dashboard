import { useCallback, useMemo, useState } from 'react';
import api, { getStoredUser } from '../lib/api';
import { closeSocket } from '../lib/socket';
import { AuthContext } from './AuthContext';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback((data) => {
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    closeSocket();
    setUser(null);
  }, []);

  // Re-reads the account from the server (e.g. to show the latest wallet balance).
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser((current) => {
        if (!current) return current;
        const next = { ...current, ...data };
        localStorage.setItem('user', JSON.stringify(next));
        return next;
      });
    } catch {
      /* the api client already handles expired or suspended sessions */
    }
  }, []);

  const value = useMemo(() => ({ user, login, logout, refreshUser }), [user, login, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
