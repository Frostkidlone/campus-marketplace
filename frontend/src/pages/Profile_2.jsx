
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
export default function Profile(){
  const {id}=useParams(); const [user,setUser]=useState(null); const [products,setProducts]=useState([]);
  useEffect(()=>{ api.get(`/users/profile/${id}`).then(r=>setUser(r.data)); api.get(`/products?seller_id=${id}`).then(r=>setProducts(r.data)); },[id]);
  if(!user) return <div className="min-h-screen grid place-items-center">Loading...</div>;
  return (<div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8"><div className="rounded-[28px] bg-white border border-zinc-100 shadow-card p-8 flex gap-6 items-center"><div className="h-20 w-20 rounded-full bg-zinc-900 text-white grid place-items-center font-bold text-2xl">{user.name[0]}</div><div><h1 className="font-display font-bold text-[22px]">{user.name}</h1><p className="text-sm text-zinc-500">{user.department} • {user.matric_no} • Joined {new Date(user.created_at).toLocaleDateString()}</p><p className="text-sm mt-2">{user.total_listings} listings • {user.active} active</p></div></div><h2 className="font-display font-bold text-[20px] mt-10 mb-4">Listings by {user.name}</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{products.map(p=> <ProductCard key={p.product_id} product={p} />)}</div></div>);
}
