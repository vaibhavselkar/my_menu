import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [caterer, setCaterer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(res => setCaterer(res.data.caterer))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = (token, catererData) => {
    localStorage.setItem('token', token);
    setCaterer(catererData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCaterer(null);
  };

  const updateCaterer = (data) => setCaterer(prev => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ caterer, loading, login, logout, updateCaterer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
