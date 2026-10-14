
import { useEffect, useState, useContext } from 'react'
import api from '../api'
import { AuthContext } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
export default function Dashboard(){
  const {user}=useContext(AuthContext)
  const [my,setMy]=useState([])
  const [convs,setConvs]=useState([])
  useEffect(()=>{ api.get('/products/my/').then(r=>setMy(r.data.results||r.data)).catch(()=>{}); api.get('/messages/conversations/').then(r=>setConvs(r.data.results||r.data)).catch(()=>{}) },[])
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Dashboard - Figure 4.4</h1>
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white border rounded-xl p-6"><p className="font-semibold">{user?.full_name}</p><p className="text-xs text-gray-500">{user?.email}</p><div className="grid grid-cols-3 gap-3 mt-4 text-center"><div className="bg-gray-50 p-3 rounded"><p className="font-bold">{my.length}</p><p className="text-xs">Listings</p></div><div className="bg-green-50 p-3 rounded"><p className="font-bold">{my.filter(m=>m.status==='available').length}</p><p className="text-xs">Active</p></div><div className="bg-blue-50 p-3 rounded"><p className="font-bold">{convs.length}</p><p className="text-xs">Msgs</p></div></div><Link to="/add-product" className="mt-4 block bg-blue-600 text-white text-center py-2 rounded-lg">Add Product</Link></div>
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">{my.map(p=><ProductCard key={p.id} product={p}/>)}</div>
      </div>
    </div>
  )
}
