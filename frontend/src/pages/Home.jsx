import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Search, Shield, Zap, Users } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ students: 0, listings: 0, available: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/products/'),
      api.get('/categories/'),
      api.get('/stats/'),
    ]).then(([productsRes, categoriesRes, statsRes]) => {
      if (productsRes.status === 'fulfilled') {
        const data = productsRes.value.data.results || productsRes.value.data;
        setProducts(Array.isArray(data) ? data.slice(0, 8) : []);
      }
      if (categoriesRes.status === 'fulfilled') {
        const data = categoriesRes.value.data.results || categoriesRes.value.data;
        setCategories(Array.isArray(data) ? data : []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="rounded-[32px] bg-zinc-900 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          <div className="absolute inset-0 premium-gradient opacity-80" />
          <div className="relative">
            <h1 className="font-display font-bold text-[40px] sm:text-[56px] leading-[0.9] tracking-tight max-w-[640px]">
              The organized way to buy &amp; sell on campus.
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-6 mt-6 max-w-[520px]">
              A centralized marketplace for FUPRE students. Browse listings, search by category,
              contact sellers, and manage your own listings in one place.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/products" className="h-12 px-7 rounded-full bg-white text-zinc-900 font-medium inline-flex items-center gap-2">
                <Search className="h-4 w-4" /> Browse Marketplace
              </Link>
              <Link to="/register" className="h-12 px-7 rounded-full bg-white/10 text-white font-medium border border-white/20">
                Join FUPRE Market
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-[480px]">
              <div>
                <p className="font-display font-bold text-3xl">{stats.students}</p>
                <p className="text-xs text-white/60 uppercase tracking-wide mt-1">Students</p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl">{stats.listings}</p>
                <p className="text-xs text-white/60 uppercase tracking-wide mt-1">Listings</p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl">{stats.available}</p>
                <p className="text-xs text-white/60 uppercase tracking-wide mt-1">Available now</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="font-display font-bold text-2xl tracking-tight">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
          {(categories.length ? categories : [
            { id: 1, category_name: 'Textbooks', icon: '📚' },
            { id: 2, category_name: 'Electronics', icon: '💻' },
            { id: 3, category_name: 'Furniture', icon: '🪑' },
            { id: 4, category_name: 'Lab Equipment', icon: '🔬' },
            { id: 5, category_name: 'Clothing', icon: '👕' },
            { id: 6, category_name: 'Stationery', icon: '📝' },
            { id: 7, category_name: 'Tools', icon: '🔧' },
            { id: 8, category_name: 'Accessories', icon: '🎧' },
          ]).map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="rounded-[20px] bg-white border border-zinc-100 p-5 hover:shadow-card transition group"
            >
              <div className="text-2xl">{cat.icon || '📦'}</div>
              <p className="font-medium text-sm mt-3 group-hover:text-zinc-900">{cat.category_name}</p>
              <p className="text-xs text-zinc-500 mt-1">{cat.product_count ?? 0} listings</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Listings */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-2xl tracking-tight">Recent Listings</h2>
          <Link to="/products" className="text-sm font-medium underline">View all</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-[280px] rounded-[24px] bg-zinc-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-[24px] bg-white border border-dashed border-zinc-200 p-10 text-center">
            <p className="font-semibold">No listings yet</p>
            <p className="text-sm text-zinc-500 mt-1">Be the first to list something for sale.</p>
            <Link to="/create-listing" className="mt-4 inline-flex h-10 px-5 rounded-full bg-zinc-900 text-white text-sm font-medium items-center">
              Create a listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-[24px] bg-white border border-zinc-100 p-6">
            <div className="h-10 w-10 rounded-full bg-zinc-900 text-white grid place-items-center"><Shield className="h-5 w-5" /></div>
            <h3 className="font-semibold mt-4">Student accounts</h3>
            <p className="text-sm text-zinc-500 mt-2">Create an account, sign in securely, and manage only your own listings.</p>
          </div>
          <div className="rounded-[24px] bg-white border border-zinc-100 p-6">
            <div className="h-10 w-10 rounded-full bg-zinc-900 text-white grid place-items-center"><Zap className="h-5 w-5" /></div>
            <h3 className="font-semibold mt-4">Organized discovery</h3>
            <p className="text-sm text-zinc-500 mt-2">Search by keyword and filter by category, status, condition, or price.</p>
          </div>
          <div className="rounded-[24px] bg-white border border-zinc-100 p-6">
            <div className="h-10 w-10 rounded-full bg-zinc-900 text-white grid place-items-center"><Users className="h-5 w-5" /></div>
            <h3 className="font-semibold mt-4">Campus focused</h3>
            <p className="text-sm text-zinc-500 mt-2">Message buyers and sellers directly, with conversations kept private.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
