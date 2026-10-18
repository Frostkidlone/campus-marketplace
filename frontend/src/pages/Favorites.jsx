import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractApiError } from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Heart, Trash2 } from 'lucide-react';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/favorites/')
      .then((response) => {
        const data = response.data.results || response.data;
        setFavorites(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(extractApiError(err, 'Could not load saved listings.')))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (favoriteId) => {
    try {
      await api.delete(`/favorites/${favoriteId}/`);
      setFavorites((current) => current.filter((favorite) => favorite.id !== favoriteId));
    } catch (err) {
      alert(extractApiError(err, 'Could not remove this saved listing.'));
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5" />
        <h1 className="font-display font-bold text-[24px] tracking-tight">Saved Listings</h1>
      </div>
      <p className="text-sm text-zinc-500 mt-1">Listings you saved to come back to later.</p>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-3">{error}</div>
      )}

      {loading ? (
        <div className="mt-8 text-zinc-500">Loading saved listings...</div>
      ) : favorites.length === 0 ? (
        <div className="mt-12 rounded-[24px] bg-white border border-dashed border-zinc-200 p-12 text-center">
          <Heart className="h-10 w-10 mx-auto text-zinc-300" />
          <p className="font-semibold mt-3">No saved listings yet</p>
          <p className="text-sm text-zinc-500 mt-1">Open a listing and tap the heart to save it here.</p>
          <Link to="/products" className="mt-5 inline-flex h-10 px-5 rounded-full bg-zinc-900 text-white text-sm font-medium items-center">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="relative">
              <ProductCard product={favorite.product} />
              <button
                onClick={() => remove(favorite.id)}
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/95 border border-zinc-200 text-red-600 grid place-items-center shadow-sm hover:bg-red-50"
                aria-label="Remove from saved listings"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
