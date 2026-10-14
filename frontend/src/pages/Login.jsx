
import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
export default function Login(){
  const [u,setU]=useState('')
  const [p,setP]=useState('')
  const [err,setErr]=useState('')
  const {login}=useContext(AuthContext)
  const nav=useNavigate()
  const submit=async(e)=>{
    e.preventDefault()
    try{
      const user=await login(u,p)
      if(user.is_staff) nav('/admin'); else nav('/dashboard')
    }catch{ setErr('Invalid credentials') }
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl border p-8">
        <h1 className="text-2xl font-bold">Login</h1><p className="text-sm text-gray-500 mb-4">Figure 4.3 Login Page</p>
        {err && <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input value={u} onChange={e=>setU(e.target.value)} placeholder="Email or Username" className="w-full border rounded-lg px-3 py-3 text-sm"/>
          <input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Password" className="w-full border rounded-lg px-3 py-3 text-sm"/>
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg">Login</button>
        </form>
        <p className="text-sm text-center mt-4">No account? <Link to="/register" className="text-blue-600">Register</Link></p>
        <p className="text-xs text-gray-400 mt-6">Admin demo: admin / Admin@123</p>
      </div>
    </div>
  )
}
