
import { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
export default function Favorites(){
  const [favs,setFavs]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{ api.get('/favorites').then(r=>setFavs(r.data)).finally(()=>setLoading(false)); },[]);
  return (<div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8"><h1 className="font-display font-bold text-[24px] tracking-tight">Saved Listings</h1>{loading ? <div className="mt-8">Loading...</div> : favs.length===0 ? <div className="mt-12 rounded-[24px] bg-white border border-dashed border-zinc-200 p-12 text-center">No favorites yet</div> : <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{favs.map(p=> <ProductCard key={p.product_id} product={p} />)}</div>}</div>);
}
