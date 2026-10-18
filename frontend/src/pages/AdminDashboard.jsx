import { useEffect, useState } from 'react';
import api, { extractApiError } from '../api/axios';
import { Users, Package, MessageCircle, CheckCircle, Trash2, UserX, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState({ users: 0, active_users: 0, products: 0, active_listings: 0, messages: 0 });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    setError('');
    try {
      const [statsResponse, usersResponse, productsResponse] = await Promise.all([
        api.get('/admin/stats/'),
        api.get('/users/'),
        api.get('/products/'),
      ]);
      setStats(statsResponse.data);
      const userData = usersResponse.data.results || usersResponse.data;
      const productData = productsResponse.data.results || productsResponse.data;
      setUsers(Array.isArray(userData) ? userData : []);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (err) {
      setError(extractApiError(err, 'Could not load the administration data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refreshStats = async () => {
    try {
      const response = await api.get('/admin/stats/');
      setStats(response.data);
    } catch {
      // Keep the last known totals.
    }
  };

  const toggleUser = async (user) => {
    setBusy(`user-${user.id}`);
    try {
      const response = await api.patch(`/users/${user.id}/`, { is_active: !user.is_active });
      setUsers((current) => current.map((item) => item.id === user.id ? response.data : item));
      await refreshStats();
    } catch (err) {
      alert(extractApiError(err, 'Could not update this account.'));
    } finally {
      setBusy('');
    }
  };

  const moderateListing = async (product) => {
    if (!window.confirm(`Delete “${product.product_name}”? This cannot be undone.`)) return;
    setBusy(`product-${product.id}`);
    try {
      await api.delete(`/products/${product.id}/`);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      await refreshStats();
    } catch (err) {
      alert(extractApiError(err, 'Could not moderate this listing.'));
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-[1280px] px-4 py-12 text-zinc-500">Loading administration data...</div>;
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-[28px] tracking-tight">Admin Dashboard</h1>
      <p className="text-sm text-zinc-500 mt-1">Manage student accounts and moderate marketplace listings.</p>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-3">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="rounded-[20px] bg-white border border-zinc-100 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total Users</p>
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="font-display font-bold text-3xl mt-2">{stats.users}</p>
          <p className="text-[11px] text-zinc-400 mt-1">{stats.active_users} active</p>
        </div>
        <div className="rounded-[20px] bg-white border border-zinc-100 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Listings</p>
            <Package className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="font-display font-bold text-3xl mt-2">{stats.products}</p>
          <p className="text-[11px] text-zinc-400 mt-1">{stats.active_listings} available</p>
        </div>
        <div className="rounded-[20px] bg-white border border-zinc-100 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Messages</p>
            <MessageCircle className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="font-display font-bold text-3xl mt-2">{stats.messages}</p>
          <p className="text-[11px] text-zinc-400 mt-1">across all conversations</p>
        </div>
        <div className="rounded-[20px] bg-white border border-zinc-100 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Available</p>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <p className="font-display font-bold text-3xl mt-2">{stats.active_listings}</p>
          <p className="text-[11px] text-zinc-400 mt-1">open listings</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="rounded-[24px] bg-white border border-zinc-100 p-6">
          <h3 className="font-semibold">User Management</h3>
          <p className="text-xs text-zinc-500 mt-1">Deactivated accounts cannot sign in.</p>
          <div className="mt-4 space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-zinc-400">No users found.</p>
            ) : users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-zinc-100 grid place-items-center font-bold text-xs shrink-0">
                    {user.first_name?.[0] || user.username?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${user.role === 'admin' ? 'bg-zinc-900 text-white' : 'bg-zinc-100'}`}>
                    {user.role}
                  </span>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${user.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {user.is_active ? 'active' : 'disabled'}
                  </span>
                  <button
                    onClick={() => toggleUser(user)}
                    disabled={busy === `user-${user.id}` || user.id === currentUser?.id}
                    title={user.id === currentUser?.id ? 'You cannot deactivate your own account.' : undefined}
                    className={`h-8 w-8 rounded-full grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed ${user.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                    aria-label={user.is_active ? 'Deactivate account' : 'Reactivate account'}
                  >
                    {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] bg-white border border-zinc-100 p-6">
          <h3 className="font-semibold">Listing Moderation</h3>
          <p className="text-xs text-zinc-500 mt-1">Remove listings that break marketplace rules.</p>
          <div className="mt-4 space-y-3">
            {products.length === 0 ? (
              <p className="text-sm text-zinc-400">No listings found.</p>
            ) : products.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{product.product_name}</p>
                  <p className="text-xs text-zinc-500">
                    ₦{Number(product.price).toLocaleString()} • {product.status} • {product.seller?.username}
                  </p>
                </div>
                <button
                  onClick={() => moderateListing(product)}
                  disabled={busy === `product-${product.id}`}
                  className="h-8 w-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 grid place-items-center disabled:opacity-50 shrink-0"
                  aria-label="Delete listing"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
