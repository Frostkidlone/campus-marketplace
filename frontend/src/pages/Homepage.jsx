
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import ProductCard from '../components/ProductCard'
export default function Homepage(){
  const [products,setProducts]=useState([])
  const [cats,setCats]=useState([])
  const [search,setSearch]=useState('')
  useEffect(()=>{ api.get('/products/').then(r=>setProducts(r.data.results || r.data)).catch(()=>{}); api.get('/categories/').then(r=>setCats(r.data.results||r.data)).catch(()=>{}) },[])
  return (
    <div>
      <div className="bg-blue-600 text-white py-16"><div className="max-w-7xl mx-auto px-4"><h1 className="text-4xl font-bold">FUPRE Campus Marketplace</h1><p className="mt-2 text-blue-100">Centralized platform for students - Figure 4.1 Homepage</p><div className="mt-6 bg-white rounded-xl p-2 flex gap-2 max-w-xl"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search textbooks, electronics..." className="flex-1 px-4 py-2 text-gray-900 outline-none"/><Link to={`/search?q=${search}`} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Search</Link></div></div></div>
      <div className="max-w-7xl mx-auto px-4 py-8"><h2 className="font-bold mb-4">Categories</h2><div className="grid grid-cols-3 md:grid-cols-6 gap-3">{cats.map(c=><Link key={c.id} to={`/search?category=${c.slug}`} className="bg-white border p-4 rounded-xl text-center"><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-gray-500">{c.product_count||0} items</p></Link>)}</div></div>
      <div className="max-w-7xl mx-auto px-4 pb-12"><h2 className="font-bold mb-4">Featured Products</h2><div className="grid md:grid-cols-4 gap-5">{products.slice(0,8).map(p=><ProductCard key={p.id} product={p}/>)}</div></div>
    </div>
  )
}
