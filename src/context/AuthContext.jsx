import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const checkAuth = async () => {
    try {
      const response = await api.get('/user');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (data) => {
    setErrors({});
    try {
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
      const response = await api.post('/login', data);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
      }
      throw error;
    }
  };

  const register = async (data) => {
    setErrors({});
    try {
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true });

      // Utiliser FormData pour supporter l'upload de fichiers
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });

      const response = await api.post('/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (data.role !== 'professionnel') {
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } finally {
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    try {
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
      const response = await api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (data) => {
    setErrors({});
    try {
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
      const response = await api.post('/reset-password', data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
      }
      throw error;
    }
  };

  const value = {
    user,
    checkAuth,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    loading,
    errors,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};