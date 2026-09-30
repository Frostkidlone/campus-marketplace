
import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
const AuthContext = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(()=>{ const saved=localStorage.getItem('user'); return saved?JSON.parse(saved):null; });
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ const checkAuth=async()=>{ const token=localStorage.getItem('token'); if(!token){setLoading(false);return;} try{ const res=await api.get('/auth/me'); setUser(res.data); localStorage.setItem('user', JSON.stringify(res.data)); }catch{ localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); }finally{ setLoading(false);} }; checkAuth(); },[]);
  const login=async(email,password)=>{ const res=await api.post('/auth/login',{email,password}); localStorage.setItem('token',res.data.token); localStorage.setItem('user',JSON.stringify(res.data.user)); setUser(res.data.user); return res.data; };
  const register=async(data)=>{ const res=await api.post('/auth/register',data); localStorage.setItem('token',res.data.token); localStorage.setItem('user',JSON.stringify(res.data.user)); setUser(res.data.user); return res.data; };
  const logout=()=>{ localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };
  return <AuthContext.Provider value={{user,login,register,logout,loading,isAdmin:user?.role==='admin'}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
