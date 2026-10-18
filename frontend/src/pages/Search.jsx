import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { extractApiError } from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    q: params.get('q') || '',
    category: params.get('category') || 'All',
    status: params.get('status') || 'All',
    condition: params.get('condition') || 'Any',
    min_price: params.get('min_price') || '',
    max_price: params.get('max_price') || '',
  });

  useEffect(() => {
    api.get('/categories/')
      .then((response) => {
        const data = response.data.results || response.data;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const fetchProducts = async (activeFilters) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (activeFilters.q) query.set('q', activeFilters.q);
      if (activeFilters.category && activeFilters.category !== 'All') query.set('category', activeFilters.category);
      if (activeFilters.status && activeFilters.status !== 'All') query.set('status', activeFilters.status);
      if (activeFilters.condition && activeFilters.condition !== 'Any') query.set('condition', activeFilters.condition);
      if (activeFilters.min_price) query.set('min_price', activeFilters.min_price);
      if (activeFilters.max_price) query.set('max_price', activeFilters.max_price);
      const response = await api.get(`/products/?${query.toString()}`);
      const data = response.data.results || response.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractApiError(err, 'Could not load listings.'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fromUrl = {
      q: params.get('q') || '',
      category: params.get('category') || 'All',
      status: params.get('status') || 'All',
      condition: params.get('condition') || 'Any',
      min_price: params.get('min_price') || '',
      max_price: params.get('max_price') || '',
    };
    setFilters(fromUrl);
    fetchProducts(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  const handleSearch = (event) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (filters.q) next.set('q', filters.q);
    if (filters.category && filters.category !== 'All') next.set('category', filters.category);
    if (filters.status && filters.status !== 'All') next.set('status', filters.status);
    if (filters.condition && filters.condition !== 'Any') next.set('condition', filters.condition);
    if (filters.min_price) next.set('min_price', filters.min_price);
    if (filters.max_price) next.set('max_price', filters.max_price);
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-[28px] tracking-tight">Marketplace</h1>
      <p className="text-sm text-zinc-500 mt-1">Search listings or narrow them down by category, status, condition, and price.</p>

      <div className="flex flex-col lg:flex-row gap-6 mt-8">
        {/* Filters */}
        <div className="lg:w-[280px] shrink-0">
          <div className="rounded-[20px] bg-white border border-zinc-100 p-5 shadow-soft lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Filters</h3>
            </div>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="text-xs font-semibold" htmlFor="filter-q">Search</label>
                <div className="relative mt-1.5">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    id="filter-q"
                    value={filters.q}
                    onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                    placeholder="Calculator, textbook..."
                    className="w-full h-11 pl-10 pr-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold" htmlFor="filter-category">Category</label>
                <select
                  id="filter-category"
                  value={filters.category}
                  onChange={(event) => setFilters({ ...filters, category: event.target.value })}
                  className="mt-1.5 w-full h-11 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white outline-none text-sm"
                >
                  <option value="All">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.category_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold" htmlFor="filter-status">Status</label>
                <select
                  id="filter-status"
                  value={filters.status}
                  onChange={(event) => setFilters({ ...filters, status: event.target.value })}
                  className="mt-1.5 w-full h-11 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white outline-none text-sm"
                >
                  <option value="All">All</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold" htmlFor="filter-condition">Condition</label>
                <select
                  id="filter-condition"
                  value={filters.condition}
                  onChange={(event) => setFilters({ ...filters, condition: event.target.value })}
                  className="mt-1.5 w-full h-11 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white outline-none text-sm"
                >
                  <option value="Any">Any</option>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Used">Used</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold" htmlFor="filter-min">Min ₦</label>
                  <input
                    id="filter-min"
                    type="number"
                    min="0"
                    value={filters.min_price}
                    onChange={(event) => setFilters({ ...filters, min_price: event.target.value })}
                    placeholder="0"
                    className="mt-1.5 w-full h-11 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold" htmlFor="filter-max">Max ₦</label>
                  <input
                    id="filter-max"
                    type="number"
                    min="0"
                    value={filters.max_price}
                    onChange={(event) => setFilters({ ...filters, max_price: event.target.value })}
                    placeholder="120000"
                    className="mt-1.5 w-full h-11 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white outline-none text-sm"
                  />
                </div>
              </div>
              <button type="submit" className="w-full h-11 rounded-full bg-zinc-900 text-white text-sm font-medium">
                Apply Filters
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-3 mb-4">{error}</div>
          )}
          <p className="text-sm text-zinc-500 mb-4">
            {loading ? 'Searching...' : `${products.length} ${products.length === 1 ? 'result' : 'results'}`}
          </p>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-[280px] rounded-[24px] bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[24px] bg-white border border-dashed border-zinc-200 p-12 text-center">
              <p className="font-semibold">No listings match your filters</p>
              <p className="text-sm text-zinc-500 mt-1">Try a different keyword, category, or price range.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
