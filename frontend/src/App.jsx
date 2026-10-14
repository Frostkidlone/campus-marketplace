
import { useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, AuthContext } from './context/AuthContext'
import Navbar from './components/Navbar'
import Homepage from './pages/Homepage'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/StudentDashboard'
import ProductListing from './pages/ProductListing'
import Search from './pages/SearchFilter'
import Details from './pages/ProductDetails'
import Add from './pages/AddProduct'
import Messaging from './pages/Messaging'
import Admin from './pages/AdminDashboard'
function Protected({children, admin}){
  const {user,loading}=useContext(AuthContext)
  if(loading) return <div className="p-8">Loading...</div>
  if(!user) return <Navigate to="/login"/>
  if(admin && !user.is_staff) return <Navigate to="/dashboard"/>
  return children
}
export default function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar/>
        <Routes>
          <Route path="/" element={<Homepage/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/products" element={<ProductListing/>}/>
          <Route path="/search" element={<Search/>}/>
          <Route path="/products/:id" element={<Details/>}/>
          <Route path="/dashboard" element={<Protected><Dashboard/></Protected>}/>
          <Route path="/add-product" element={<Protected><Add/></Protected>}/>
          <Route path="/messages" element={<Protected><Messaging/></Protected>}/>
          <Route path="/admin" element={<Protected admin><Admin/></Protected>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
