import { useEffect, useState } from 'react';
import api, { extractApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { Mail, GraduationCap, MapPin, Calendar } from 'lucide-react';

export default function Profile() {
  const { user: authUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState(authUser);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const current = await refreshUser();
        setProfile(current);
        const response = await api.get(`/products/?seller_id=${current.id}`);
        const data = response.data.results || response.data;
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(extractApiError(err, 'Could not load your profile.'));
      } finally {
        setLoading(false);
      }
    };
    load();
    // refreshUser is stable; run once for the signed-in account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="mx-auto max-w-[1280px] px-4 py-12 text-zinc-500">Loading profile...</div>;
  }

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || 'Student';

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-3 mb-6">{error}</div>
      )}

      <div className="rounded-[28px] bg-white border border-zinc-100 shadow-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          <div className="h-20 w-20 rounded-full bg-zinc-900 text-white grid place-items-center font-bold text-2xl shrink-0">
            {profile?.first_name?.[0] || profile?.username?.[0] || 'S'}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display font-bold text-[24px] tracking-tight">{name}</h1>
              <span className="text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-zinc-100 font-medium">
                {profile?.role || 'student'}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{profile?.email}</span>
              {profile?.department && <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{profile.department}</span>}
              {profile?.matric_no && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{profile.matric_no}</span>}
              {profile?.date_joined && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />Joined {new Date(profile.date_joined).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
          <div className="rounded-[18px] bg-zinc-50 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Listings</p>
            <p className="font-display font-bold text-2xl mt-1">{products.length}</p>
          </div>
          <div className="rounded-[18px] bg-zinc-50 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Available</p>
            <p className="font-display font-bold text-2xl mt-1">{products.filter((product) => product.status === 'available').length}</p>
          </div>
          <div className="rounded-[18px] bg-zinc-50 p-4 col-span-2 sm:col-span-1">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total views</p>
            <p className="font-display font-bold text-2xl mt-1">{products.reduce((total, product) => total + (product.views || 0), 0)}</p>
          </div>
        </div>
      </div>

      <h2 className="font-display font-bold text-[20px] mt-10 mb-4">Your listings</h2>
      {products.length === 0 ? (
        <div className="rounded-[24px] bg-white border border-dashed border-zinc-200 p-10 text-center">
          <p className="text-sm text-zinc-500">You have not created any listings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}
