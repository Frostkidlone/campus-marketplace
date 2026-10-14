
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
export default function Add(){
  const nav=useNavigate()
  const [cats,setCats]=useState([])
  const [form,setForm]=useState({title:'',description:'',price:'',category:'',condition:'used',location:'',status:'available'})
  const [img,setImg]=useState(null)
  useEffect(()=>{ api.get('/categories/').then(r=>setCats(r.data.results||r.data)) },[])
  const submit=async(e)=>{
    e.preventDefault()
    const fd=new FormData()
    Object.entries(form).forEach(([k,v])=>fd.append(k,v))
    if(img) fd.append('image', img)
    const r=await api.post('/products/', fd, {headers:{'Content-Type':'multipart/form-data'}})
    nav(`/products/${r.data.id}`)
  }
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Add Product - Figure 4.8</h1>
      <form onSubmit={submit} className="bg-white border rounded-xl p-6 mt-4 space-y-4">
        <input required placeholder="Product Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full border rounded-lg px-3 py-2.5"/>
        <textarea required placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={4} className="w-full border rounded-lg px-3 py-2.5"/>
        <div className="grid grid-cols-2 gap-4"><input type="number" required placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="border rounded-lg px-3 py-2.5"/><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="border rounded-lg px-3 py-2.5"><option value="">Category</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-4"><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="border rounded-lg px-3 py-2.5"><option value="new">New</option><option value="like_new">Like New</option><option value="used">Used</option><option value="fair">Fair</option></select><input placeholder="Location e.g Hostel B" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className="border rounded-lg px-3 py-2.5"/></div>
        <input type="file" accept="image/*" onChange={e=>setImg(e.target.files[0])} className="w-full border rounded-lg px-3 py-2.5"/>
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg">Create Listing</button>
      </form>
    </div>
  )
}
