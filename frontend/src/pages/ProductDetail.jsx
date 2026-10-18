import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { extractApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProductImage from '../components/ProductImage';
import { MapPin, Eye, MessageCircle, ArrowLeft, Heart, Package } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteId, setFavoriteId] = useState(null);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/products/${id}/`);
        setProduct(response.data);

        // Count a view once per browser session so refreshes do not inflate it.
        const viewKey = `viewed-product-${id}`;
        if (!sessionStorage.getItem(viewKey)) {
          try {
            const viewResponse = await api.post(`/products/${id}/increment_views/`);
            setProduct((current) => current ? { ...current, views: viewResponse.data.views } : current);
            sessionStorage.setItem(viewKey, '1');
          } catch {
            // View counting must never block the page.
          }
        }

        if (user) {
          try {
            const favResponse = await api.get('/favorites/');
            const favorites = favResponse.data.results || favResponse.data;
            const match = Array.isArray(favorites)
              ? favorites.find((favorite) => favorite.product?.id === Number(id))
              : null;
            setFavoriteId(match?.id ?? null);
          } catch {
            setFavoriteId(null);
          }
        }
      } catch (err) {
        setError(extractApiError(err, 'This listing could not be loaded.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    setFavoriteBusy(true);
    try {
      if (favoriteId) {
        await api.delete(`/favorites/${favoriteId}/`);
        setFavoriteId(null);
      } else {
        const response = await api.post('/favorites/', { product_id: Number(id) });
        setFavoriteId(response.data.id);
      }
    } catch (err) {
      alert(extractApiError(err, 'Could not update saved listings.'));
    } finally {
      setFavoriteBusy(false);
    }
  };

  const handleContact = () => {
    if (!user) {
      navigate('/login', { state: { from: `/messages?product=${product.id}&seller=${product.seller.id}` } });
      return;
    }
    if (product?.seller?.id === user.id) return;
    navigate(`/messages?product=${product.id}&seller=${product.seller.id}`);
  };

  if (loading) {
    return <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 text-zinc-500">Loading listing...</div>;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-[24px] bg-white border border-zinc-100 p-10 text-center">
          <Package className="h-10 w-10 mx-auto text-zinc-300" />
          <p className="font-semibold mt-3">Listing unavailable</p>
          <p className="text-sm text-zinc-500 mt-1">{error || 'This listing may have been removed.'}</p>
          <Link to="/products" className="mt-5 inline-flex h-10 px-5 rounded-full bg-zinc-900 text-white text-sm font-medium items-center">
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  const sellerName = [product.seller?.first_name, product.seller?.last_name].filter(Boolean).join(' ')
    || product.seller?.username
    || 'Student seller';
  const isOwner = user?.id === product.seller?.id;

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Marketplace
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="rounded-[28px] bg-white border border-zinc-100 overflow-hidden">
          <div className="aspect-[4/3] bg-zinc-100">
            <ProductImage
              src={product.image}
              alt={product.product_name}
              className="w-full h-full object-cover"
            />
          </div>
          {Array.isArray(product.images) && product.images.length > 0 && (
            <div className="p-4 grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((image, index) => (
                <div key={index} className="aspect-square rounded-xl bg-zinc-100 overflow-hidden">
                  <ProductImage src={image} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display font-bold text-[28px] leading-tight tracking-tight">{product.product_name}</h1>
              <button
                onClick={toggleFavorite}
                disabled={favoriteBusy}
                className={`shrink-0 h-10 w-10 rounded-full grid place-items-center border transition ${
                  favoriteId
                    ? 'bg-red-50 border-red-100 text-red-600'
                    : 'bg-white border-zinc-200 text-zinc-500 hover:text-red-600'
                } disabled:opacity-50`}
                aria-label={favoriteId ? 'Remove from saved listings' : 'Save this listing'}
              >
                <Heart className={`h-4 w-4 ${favoriteId ? 'fill-current' : ''}`} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-zinc-500">
              <span className="text-xs px-3 py-1 rounded-full bg-zinc-100 capitalize">{product.status}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{product.location || 'Campus'}</span>
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{product.views} views</span>
              <span>{new Date(product.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Price card */}
          <div className="rounded-[28px] bg-zinc-900 text-white p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wide text-white/60">Price</p>
            <p className="font-display font-bold text-[36px] mt-1">₦{Number(product.price).toLocaleString()}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10">{product.condition_type}</span>
              {product.category_name && (
                <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10">{product.category_name}</span>
              )}
            </div>
            {isOwner ? (
              <div className="w-full h-12 rounded-full bg-white/10 border border-white/20 text-white font-medium mt-6 flex items-center justify-center text-sm">
                This is your listing
              </div>
            ) : (
              <button
                onClick={handleContact}
                className="w-full h-12 rounded-full bg-white text-zinc-900 font-medium mt-6 hover:bg-zinc-100 flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" /> Contact Seller
              </button>
            )}
            <p className="text-[11px] text-white/50 mt-3 text-center">
              Arrange the exchange directly with the seller. This platform does not process payments.
            </p>
          </div>

          <div className="rounded-[24px] bg-white border border-zinc-100 p-6">
            <h3 className="font-semibold">Description</h3>
            <p className="text-sm text-zinc-600 leading-6 mt-3 whitespace-pre-wrap">{product.description}</p>
          </div>

          <div className="rounded-[24px] bg-white border border-zinc-100 p-6">
            <h3 className="font-semibold">Seller</h3>
            <div className="flex items-center gap-3 mt-4">
              <div className="h-10 w-10 rounded-full bg-zinc-900 text-white grid place-items-center font-bold">
                {product.seller?.first_name?.[0] || product.seller?.username?.[0] || 'S'}
              </div>
              <div>
                <p className="font-medium text-sm">{sellerName}</p>
                <p className="text-xs text-zinc-500">{product.seller?.department || 'Campus seller'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
