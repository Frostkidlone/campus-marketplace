
import { useEffect, useState } from 'react'
import api from '../api'
export default function Messaging(){
  const [convs,setConvs]=useState([])
  const [sel,setSel]=useState(null)
  const [msgs,setMsgs]=useState([])
  const [newM,setNewM]=useState('')
  useEffect(()=>{ api.get('/messages/conversations/').then(r=>setConvs(r.data.results||r.data)) },[])
  const open=async(c)=>{ setSel(c); const r=await api.get(`/messages/conversations/${c.id}/messages/`); setMsgs(r.data.results||r.data) }
  const send=async()=>{ const r=await api.post(`/messages/conversations/${sel.id}/messages/`, {content:newM}); setMsgs([...msgs,r.data]); setNewM('') }
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">Messages - Figure 4.9</h1>
      <div className="bg-white border rounded-xl grid md:grid-cols-3 min-h-[600px] mt-4">
        <div className="border-r">{convs.map(c=><button key={c.id} onClick={()=>open(c)} className="w-full text-left p-4 border-b hover:bg-gray-50"><p className="text-sm font-medium">{c.product?.title}</p><p className="text-xs text-gray-500">{c.last_message?.content || 'No messages'}</p></button>)}</div>
        <div className="md:col-span-2 flex flex-col">{sel ? <><div className="p-4 border-b"><p className="font-semibold text-sm">{sel.product?.title} linked</p></div><div className="flex-1 p-4 space-y-2 overflow-auto">{msgs.map(m=><div key={m.id} className="bg-gray-100 p-3 rounded-lg text-sm max-w-[75%]"><p>{m.content}</p><p className="text-[10px] text-gray-500">{m.sender?.full_name}</p></div>)}</div><div className="p-4 border-t flex gap-2"><input value={newM} onChange={e=>setNewM(e.target.value)} className="flex-1 border rounded-lg px-3 py-2"/><button onClick={send} className="bg-blue-600 text-white px-5 py-2 rounded-lg">Send</button></div></> : <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Select conversation</div>}</div>
      </div>
    </div>
  )
}
