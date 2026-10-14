
import { useEffect, useState } from 'react'
import api from '../api'
export default function Admin(){
  const [stats,setStats]=useState(null)
  const [users,setUsers]=useState([])
  const [products,setProducts]=useState([])
  useEffect(()=>{ api.get('/admin/stats/').then(r=>setStats(r.data)).catch(()=>{}); api.get('/auth/admin/users/').then(r=>setUsers(r.data.results||r.data)).catch(()=>{}); api.get('/products/admin/all/').then(r=>setProducts(r.data.results||r.data)).catch(()=>{}) },[])
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Admin Dashboard - Figure 4.10</h1>
      {stats && <div className="grid grid-cols-5 gap-4 mt-6"><div className="bg-white border p-5 rounded-xl"><p className="text-xs">Total Users</p><p className="text-2xl font-bold">{stats.total_users}</p></div><div className="bg-white border p-5 rounded-xl"><p className="text-xs">Total Products</p><p className="text-2xl font-bold">{stats.total_products}</p></div><div className="bg-white border p-5 rounded-xl"><p className="text-xs">Active</p><p className="text-2xl font-bold text-green-600">{stats.active_listings}</p></div><div className="bg-white border p-5 rounded-xl"><p className="text-xs">Reported</p><p className="text-2xl font-bold text-red-600">{stats.reported_listings}</p></div><div className="bg-white border p-5 rounded-xl"><p className="text-xs">Categories</p><p className="text-2xl font-bold">{stats.total_categories}</p></div></div>}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white border rounded-xl"><div className="p-4 border-b font-semibold">Users</div><div className="max-h-[400px] overflow-auto">{users.map(u=><div key={u.id} className="p-3 border-b text-sm"><p className="font-medium">{u.full_name} - {u.email}</p><p className="text-xs text-gray-500">{u.matric_number} {u.is_staff?'Admin':''}</p></div>)}</div></div>
        <div className="bg-white border rounded-xl"><div className="p-4 border-b font-semibold">Products</div><div className="max-h-[400px] overflow-auto">{products.map(p=><div key={p.id} className="p-3 border-b text-sm flex justify-between"><div><p className="font-medium">{p.title}</p><p className="text-xs text-gray-500">{p.seller?.full_name} - ₦{p.price}</p></div><span className="text-xs">{p.status}</span></div>)}</div></div>
      </div>
    </div>
  )
}
