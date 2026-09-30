
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import Search from './pages/Search';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
function Layout({ children }) {
  return (<div className="min-h-screen bg-[#fcfcfd]"><Navbar /><main>{children}</main><footer className="border-t border-zinc-100 mt-20 py-12"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between gap-4 text-sm text-zinc-500"><p>© {new Date().getFullYear()} FUPRE Market — Online Marketplace for Campus Students. Final Year Project (Waterfall Model).</p><p>Built with 3-Tier Architecture • RBAC • Secure Auth</p></div></footer></div>);
}
export default function App(){
  return (<AuthProvider><BrowserRouter><Layout><Routes><Route path="/" element={<Home />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/product/:id" element={<ProductDetail />} /><Route path="/search" element={<Search />} /><Route path="/seller/:id" element={<Profile />} /><Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} /><Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="/create-listing" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} /><Route path="/edit-listing/:id" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} /><Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} /><Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} /></Routes></Layout></BrowserRouter></AuthProvider>);
}
