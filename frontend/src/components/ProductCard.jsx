import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';

export default function ProductCard({ product }) {
  if (!product) return null;
  const statusClass = product.status === 'available'
    ? 'bg-green-50 text-green-700'
    : product.status === 'reserved'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-zinc-100 text-zinc-600';

  return (
    <Link
      to={`/products/${product.id}`}
      className="rounded-[24px] bg-white border border-zinc-100 overflow-hidden hover:shadow-card transition group flex flex-col"
    >
      <div className="aspect-[4/3] bg-zinc-100 overflow-hidden">
        <ProductImage
          src={product.image}
          alt={product.product_name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="font-medium text-sm line-clamp-2">{product.product_name}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="font-bold">₦{Number(product.price || 0).toLocaleString()}</p>
          <span className="text-[10px] uppercase tracking-wide font-medium px-2 py-1 rounded-full bg-zinc-100">
            {product.condition_type}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium capitalize ${statusClass}`}>
            {product.status}
          </span>
          <span className="text-xs text-zinc-500 truncate">{product.location || 'Campus'}</span>
        </div>
      </div>
    </Link>
  );
}
