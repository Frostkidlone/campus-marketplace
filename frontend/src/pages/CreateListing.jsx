import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { extractApiError, getImageUrl } from '../api/axios';

const emptyForm = {
  product_name: '',
  price: '',
  description: '',
  category: '',
  condition_type: 'Used',
  location: 'Campus',
  status: 'available',
};

export default function CreateListing() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories/')
      .then((response) => {
        const data = response.data.results || response.data;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    if (isEdit) {
      setFetching(true);
      api.get(`/products/${id}/`)
        .then((response) => {
          const product = response.data;
          setForm({
            product_name: product.product_name || '',
            price: product.price ?? '',
            description: product.description || '',
            category: product.category ?? '',
            condition_type: product.condition_type || 'Used',
            location: product.location || 'Campus',
            status: product.status || 'available',
          });
          setPreview(getImageUrl(product.image) || '');
        })
        .catch((err) => setError(extractApiError(err, 'Could not load this listing.')))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }
    setError('');
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          data.append(key, value);
        }
      });
      if (image) data.append('image', image);

      if (isEdit) {
        await api.patch(`/products/${id}/`, data);
      } else {
        await api.post('/products/', data);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(extractApiError(err, 'Could not save this listing.'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="mx-auto max-w-[720px] px-4 py-12 text-zinc-500">Loading listing...</div>;
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-[28px] tracking-tight">{isEdit ? 'Edit Listing' : 'Create New Listing'}</h1>
          <p className="text-sm text-zinc-500 mt-1">Add clear details so buyers can find what they need.</p>
        </div>
        <Link to="/dashboard" className="text-sm font-medium underline shrink-0">Cancel</Link>
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-3">{error}</div>
      )}

      <form onSubmit={submit} className="mt-8 rounded-[24px] bg-white border border-zinc-100 shadow-card p-6 sm:p-8 space-y-5">
        <div>
          <label className="text-xs font-semibold" htmlFor="listing-image">Product Image (JPEG/PNG/WEBP, max 5MB)</label>
          <div className="mt-2 flex flex-col sm:flex-row gap-4">
            <div className="h-28 w-28 rounded-2xl bg-zinc-100 border border-dashed border-zinc-200 overflow-hidden grid place-items-center shrink-0">
              {preview
                ? <img src={preview} className="h-full w-full object-cover" alt="Product preview" />
                : <span className="text-xs text-zinc-400">No image</span>}
            </div>
            <div className="flex-1">
              <input
                id="listing-image"
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-zinc-900 file:text-white file:px-4 file:py-2 file:text-sm"
              />
              <p className="text-[11px] text-zinc-500 mt-2">
                Images are optional. Listings without a photo show a placeholder.
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold" htmlFor="product-name">Product Name *</label>
            <input
              id="product-name"
              value={form.product_name}
              onChange={update('product_name')}
              required
              minLength={3}
              placeholder="e.g. Used Scientific Calculator - Casio fx-991ES Plus"
              className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-brand-500/10 outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="product-price">Price (₦) *</label>
            <input
              id="product-price"
              value={form.price}
              onChange={update('price')}
              required
              type="number"
              min="1"
              step="0.01"
              placeholder="6500"
              className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="product-category">Category *</label>
            <select
              id="product-category"
              value={form.category}
              onChange={update('category')}
              required
              className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.category_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="product-condition">Condition</label>
            <select
              id="product-condition"
              value={form.condition_type}
              onChange={update('condition_type')}
              className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
            >
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Used">Used</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold" htmlFor="product-location">Location</label>
            <input
              id="product-location"
              value={form.location}
              onChange={update('location')}
              placeholder="e.g. Hostel Block A"
              className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold" htmlFor="product-description">Description *</label>
            <textarea
              id="product-description"
              value={form.description}
              onChange={update('description')}
              required
              rows={4}
              placeholder="Condition, reason for selling, and how you would like to be contacted."
              className="mt-1.5 w-full rounded-[20px] bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-brand-500/10 outline-none text-sm p-4"
            />
          </div>
          {isEdit && (
            <div>
              <label className="text-xs font-semibold" htmlFor="product-status">Availability</label>
              <select
                id="product-status"
                value={form.status}
                onChange={update('status')}
                className="mt-1.5 w-full h-12 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          )}
        </div>

        <button
          disabled={loading}
          className="w-full h-12 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? 'Saving...' : (isEdit ? 'Update Listing' : 'Publish Listing')}
        </button>
      </form>
    </div>
  );
}
