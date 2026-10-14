
import { useEffect, useState } from 'react'
import api from '../api'
import ProductCard from '../components/ProductCard'
export default function ProductListing(){
  const [products,setProducts]=useState([])
  useEffect(()=>{ api.get('/products/').then(r=>setProducts(r.data.results||r.data)).catch(()=>{}) },[])
  return <div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold">All Products - Figure 4.5</h1><div className="grid md:grid-cols-4 gap-5 mt-6">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div></div>
}
