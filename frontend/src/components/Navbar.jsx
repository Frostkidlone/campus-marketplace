
import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
export default function Navbar(){
  const {user,logout}=useContext(AuthContext)
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 flex justify-between h-16 items-center">
        <Link to="/" className="flex items-center gap-2"><div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">F</div><div><p className="font-bold leading-none">FUPRE</p><p className="text-xs text-gray-500 leading-none">Campus Marketplace</p></div></Link>
        <div className="hidden md:flex gap-6">
          <Link to="/products" className="text-sm">Browse</Link>
          <Link to="/search" className="text-sm">Search</Link>
          {user && <Link to="/dashboard" className="text-sm">Dashboard</Link>}
          {user && <Link to="/messages" className="text-sm">Messages</Link>}
          {user?.is_staff && <Link to="/admin" className="text-sm">Admin</Link>}
        </div>
        <div className="flex gap-3 items-center">
          {user ? (<><Link to="/add-product" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">+ Sell</Link><button onClick={logout} className="text-sm">Logout</button></>):(<><Link to="/login" className="text-sm">Login</Link><Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Register</Link></>)}
        </div>
      </div>
    </nav>
  )
}
