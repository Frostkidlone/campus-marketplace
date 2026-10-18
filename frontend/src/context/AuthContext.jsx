import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // legacy key
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/users/me/');
    persistUser(res.data);
    return res.data;
  }, [persistUser]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        // A cached user object without a token is stale; do not treat it as signed in.
        persistUser(null);
        setLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        try {
          const refresh = localStorage.getItem('refresh_token');
          if (!refresh) throw new Error('No refresh token');
          const refreshRes = await api.post('/auth/refresh/', { refresh });
          localStorage.setItem('access_token', refreshRes.data.access);
          await refreshUser();
        } catch {
          clearSession();
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [refreshUser, clearSession, persistUser]);

  const login = async (email, password) => {
    // SimpleJWT authenticates against username; accounts use email as username.
    const res = await api.post('/auth/login/', { username: email.trim().toLowerCase(), password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    return refreshUser();
  };

  const register = async (data) => {
    const payload = {
      email: data.email.trim().toLowerCase(),
      password: data.password,
      matric_no: data.matric_no || '',
      department: data.department || '',
    };
    const fullName = (data.name || data.full_name || `${data.first_name || ''} ${data.last_name || ''}`).trim();
    if (fullName) {
      payload.name = fullName;
      payload.full_name = fullName;
    }
    await api.post('/users/', payload);
    // Registration succeeded. Try to log the student straight in.
    try {
      return await login(payload.email, data.password);
    } catch {
      return null;
    }
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      refreshUser,
      loading,
      isAdmin: user?.role === 'admin' || user?.is_staff === true,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
