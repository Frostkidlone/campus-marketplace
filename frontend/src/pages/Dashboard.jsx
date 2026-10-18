import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProductImage from '../components/ProductImage';
import { Plus, Edit2, Trash2, Eye, MapPin } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/products/?seller_id=${user.id}`);
        const data = response.data.results || response.data;
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(extractApiError(err, 'Could not load your listings.'));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [user]);

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}/`);
      setProducts((current) => current.filter((product) => product.id !== id));
    } catch (err) {
      alert(extractApiError(err, 'Could not delete this listing.'));
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/products/${id}/status/`, { status });
      setProducts((current) => current.map((product) => product.id === id ? { ...product, status } : product));
    } catch (err) {
      alert(extractApiError(err, 'Could not update the listing status.'));
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-[28px] tracking-tight">Seller Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your listings, update availability, and keep your adverts current.</p>
        </div>
        <Link to="/create-listing" className="h-11 px-6 rounded-full bg-zinc-900 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-zinc-800">
          <Plus className="h-4 w-4" /> New Listing
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-3 mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-[20px] bg-white border border-zinc-100 p-5 shadow-soft">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Total Listings</p>
          <p className="font-display font-bold text-3xl mt-2">{products.length}</p>
        </div>
        <div className="rounded-[20px] bg-white border border-zinc-100 p-5 shadow-soft">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Available</p>
          <p className="font-display font-bold text-3xl mt-2">{products.filter((product) => product.status === 'available').length}</p>
        </div>
        <div className="rounded-[20px] bg-white border border-zinc-100 p-5 shadow-soft">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Total Views</p>
          <p className="font-display font-bold text-3xl mt-2">{products.reduce((total, product) => total + (product.views || 0), 0)}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[24px] bg-white border border-zinc-100 p-8 text-zinc-500">Loading your listings...</div>
      ) : products.length === 0 ? (
        <div className="rounded-[24px] bg-white border border-dashed border-zinc-200 p-12 text-center">
          <p className="font-semibold">No listings yet</p>
          <p className="text-sm text-zinc-500 mt-1">Create your first listing to reach other students.</p>
          <Link to="/create-listing" className="mt-4 inline-flex h-10 px-5 rounded-full bg-zinc-900 text-white text-sm font-medium items-center gap-2">
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="rounded-[24px] bg-white border border-zinc-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">Price</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Views</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <ProductImage compact src={product.image} alt="" className="h-12 w-12 rounded-xl object-cover bg-zinc-100 shrink-0" />
                        <div>
                          <p className="font-medium line-clamp-1 max-w-[240px]">{product.product_name}</p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{product.location || 'Campus'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold">₦{Number(product.price).toLocaleString()}</td>
                    <td className="p-4">
                      <select
                        value={product.status}
                        onChange={(event) => updateStatus(product.id, event.target.value)}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium outline-none capitalize"
                      >
                        <option value="available">available</option>
                        <option value="reserved">reserved</option>
                        <option value="sold">sold</option>
                      </select>
                    </td>
                    <td className="p-4"><span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{product.views}</span></td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <Link to={`/products/${product.id}`} className="h-8 w-8 grid place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200" aria-label="View listing">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link to={`/edit-listing/${product.id}`} className="h-8 w-8 grid place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200" aria-label="Edit listing">
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button onClick={() => deleteProduct(product.id)} className="h-8 w-8 grid place-items-center rounded-full bg-red-50 text-red-600 hover:bg-red-100" aria-label="Delete listing">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
