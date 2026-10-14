
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api'
import ProductCard from '../components/ProductCard'
export default function Search(){
  const [params,setParams]=useSearchParams()
  const [products,setProducts]=useState([])
  const [cats,setCats]=useState([])
  const [f,setF]=useState({q:params.get('q')||'',category_slug:params.get('category')||'',condition:'',min_price:'',max_price:''})
  useEffect(()=>{ api.get('/categories/').then(r=>setCats(r.data.results||r.data)).catch(()=>{}) },[])
  const doSearch=async()=>{ const q=new URLSearchParams(); Object.entries(f).forEach(([k,v])=> v && q.set(k,v)); setParams(q); const r=await api.get(`/products/?${q.toString()}`); setProducts(r.data.results||r.data) }
  useEffect(()=>{ doSearch() },[])
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Search & Filter - Figure 4.6</h1>
      <div className="grid lg:grid-cols-4 gap-6 mt-6">
        <div className="bg-white border rounded-xl p-5">
          <input value={f.q} onChange={e=>setF({...f,q:e.target.value})} placeholder="Keyword" className="w-full border rounded-lg px-3 py-2 text-sm mb-3"/>
          <select value={f.category_slug} onChange={e=>setF({...f,category_slug:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mb-3"><option value="">All Categories</option>{cats.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}</select>
          <select value={f.condition} onChange={e=>setF({...f,condition:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mb-3"><option value="">Any condition</option><option value="new">New</option><option value="like_new">Like New</option><option value="used">Used</option><option value="fair">Fair</option></select>
          <div className="grid grid-cols-2 gap-2 mb-3"><input type="number" placeholder="Min" value={f.min_price} onChange={e=>setF({...f,min_price:e.target.value})} className="border rounded-lg px-3 py-2 text-sm"/><input type="number" placeholder="Max" value={f.max_price} onChange={e=>setF({...f,max_price:e.target.value})} className="border rounded-lg px-3 py-2 text-sm"/></div>
          <button onClick={doSearch} className="w-full bg-blue-600 text-white py-2 rounded-lg">Search</button>
        </div>
        <div className="lg:col-span-3 grid md:grid-cols-3 gap-4">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>
      </div>
    </div>
  )
}
