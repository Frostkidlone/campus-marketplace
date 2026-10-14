
import { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import { AuthContext } from '../context/AuthContext'
export default function Details(){
  const {id}=useParams()
  const {user}=useContext(AuthContext)
  const [product,setProduct]=useState(null)
  const [msg,setMsg]=useState('')
  const [fb,setFb]=useState('')
  useEffect(()=>{ api.get(`/products/${id}/`).then(r=>setProduct(r.data)) },[id])
  const contact=async()=>{
    try{ await api.post('/messages/conversations/', {product:product.id, content:msg}); setFb('Message sent!'); setMsg('') }
    catch(e){ setFb(e.response?.data?.detail || 'Failed') }
  }
  if(!product) return <div className="p-8">Loading...</div>
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <p className="text-xs text-gray-500 mb-2">Figure 4.7 Product Details</p>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white border rounded-xl overflow-hidden"><div className="aspect-[4/3] bg-gray-100">{product.image_url ? <img src={product.image_url} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-gray-400">No Image</div>}</div></div>
        <div className="bg-white border rounded-xl p-6"><h1 className="text-2xl font-bold">{product.title}</h1><p className="text-blue-600 font-bold text-xl mt-1">₦{product.price}</p><p className="text-sm text-gray-500 mt-2">{product.category_name} • {product.location}</p><p className="text-sm mt-4">{product.description}</p><p className="text-xs mt-4">Seller: {product.seller?.full_name} • {product.seller?.matric_number}</p><p className="text-xs">Status: {product.status} • Views: {product.views}</p>
        {user && user.id!==product.seller?.id ? <div className="mt-6 bg-blue-50 p-4 rounded-xl"><textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3} placeholder="Hi, I'm interested..." className="w-full border rounded-lg px-3 py-2 text-sm"/><button onClick={contact} className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg">Contact Seller</button><p className="text-xs mt-2">{fb}</p></div> : null}
        </div>
      </div>
    </div>
  )
}
