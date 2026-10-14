
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
export default function Register(){
  const [form,setForm]=useState({full_name:'',username:'',email:'',phone_number:'',matric_number:'',department:'',password:'',password_confirm:''})
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(false)
  const nav=useNavigate()
  const submit=async(e)=>{
    e.preventDefault()
    setError('')
    setLoading(true)
    try{ await api.post('/auth/register/', form); nav('/login') }
    catch(err){
      const data=err.response?.data
      if(data){ setError(JSON.stringify(data, null, 2)) }
      else setError('Registration failed - check console')
      console.log(err.response)
    } finally{ setLoading(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="bg-white w-full max-w-xl rounded-2xl border p-8">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-sm text-gray-500 mb-4">Figure 4.2 Registration - Matric helps trust</p>
        {error && <pre className="bg-red-50 text-red-700 text-xs p-3 rounded mb-4 whitespace-pre-wrap">{error}</pre>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="full_name" required placeholder="Full Name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm"/>
            <input name="username" required placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm"/>
          </div>
          <input type="email" name="email" required placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="border w-full rounded-lg px-3 py-2.5 text-sm"/>
          <div className="grid grid-cols-2 gap-4">
            <input name="phone_number" placeholder="Phone" value={form.phone_number} onChange={e=>setForm({...form,phone_number:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm"/>
            <input name="matric_number" placeholder="Matric No" value={form.matric_number} onChange={e=>setForm({...form,matric_number:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm"/>
          </div>
          <input name="department" placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} className="border w-full rounded-lg px-3 py-2.5 text-sm"/>
          <div className="grid grid-cols-2 gap-4">
            <input type="password" name="password" required placeholder="Password (min 8, strong)" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm"/>
            <input type="password" name="password_confirm" required placeholder="Confirm" value={form.password_confirm} onChange={e=>setForm({...form,password_confirm:e.target.value})} className="border rounded-lg px-3 py-2.5 text-sm"/>
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg">{loading?'Creating...':'Register'}</button>
        </form>
        <p className="text-sm text-center mt-4">Have account? <Link to="/login" className="text-blue-600">Login</Link></p>
      </div>
    </div>
  )
}
