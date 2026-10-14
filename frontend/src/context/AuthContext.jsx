
import React, { createContext, useState, useEffect } from 'react'
import api from '../api'
export const AuthContext = createContext()
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(()=>{
    const token=localStorage.getItem('access')
    if(token){ api.get('/auth/me/').then(res=>setUser(res.data)).catch(()=>localStorage.clear()).finally(()=>setLoading(false)) }
    else setLoading(false)
  },[])
  const login=async(username,password)=>{
    const res=await api.post('/auth/login/', {username,password})
    localStorage.setItem('access', res.data.access)
    localStorage.setItem('refresh', res.data.refresh)
    setUser(res.data.user)
    return res.data.user
  }
  const logout=()=>{ localStorage.clear(); setUser(null); window.location.href='/login' }
  return <AuthContext.Provider value={{user,login,logout,loading,setUser}}>{children}</AuthContext.Provider>
}
