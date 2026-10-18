
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({children, adminOnly}){
  const {user, loading, isAdmin}=useAuth();
  if(loading) return <div className="p-12 text-center">Loading...</div>;
  if(!user) return <Navigate to="/login" replace />;
  if(adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
