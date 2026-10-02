import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { gql } from '../api/graphql';
import { AUTH_STORAGE_KEY } from '../api/config';
import { CURRENT_USER, LOGIN, REGISTER } from '../api/queries';

const AuthContext = createContext(null);

function readStored() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStored);
  const [checking, setChecking] = useState(Boolean(session));

  // Validate a stored token once on load; the planner issues 1-hour tokens.
  useEffect(() => {
    if (!session) return undefined;
    let cancelled = false;
    gql(CURRENT_USER, {}, session.token)
      .then((data) => { if (!cancelled && data.getCurrentUser) setSession((s) => ({ ...s, user: data.getCurrentUser })); })
      .catch(() => { if (!cancelled) setSession(null); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (session) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch { /* storage unavailable: session stays in memory */ }
  }, [session]);

  const login = useCallback(async (email, password) => {
    const data = await gql(LOGIN, { input: { email, password } });
    setSession(data.loginUser);
    return data.loginUser.user;
  }, []);

  const register = useCallback(async (input) => {
    const data = await gql(REGISTER, { input });
    setSession(data.registerUser);
    return data.registerUser.user;
  }, []);

  const logout = useCallback(() => setSession(null), []);

  const value = useMemo(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    checking,
    login,
    register,
    logout,
  }), [session, checking, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
