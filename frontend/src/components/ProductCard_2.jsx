
import { Link } from 'react-router-dom';
import { getImageUrl } from '../api/axios';
import { MapPin, Eye, Heart } from 'lucide-react';
export default function ProductCard({ product }){
  return (
    <Link to={`/product/${product.product_id}`} className="group block">
      <div className="rounded-[20px] bg-white border border-zinc-100 overflow-hidden shadow-card hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
          <img src={getImageUrl(product.image)} alt={product.product_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase backdrop-blur-md ${product.status === 'available' ? 'bg-emerald-500/90 text-white' : product.status === 'reserved' ? 'bg-amber-500/90 text-white' : 'bg-zinc-900/90 text-white'}`}>{product.status}</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/90 backdrop-blur-md text-zinc-700">{product.condition_type}</span>
          </div>
          <div className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-white/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition"><Heart className="h-4 w-4" /></div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2"><h3 className="font-semibold text-[14.5px] leading-tight line-clamp-2 flex-1">{product.product_name}</h3><span className="text-[11px] px-2 py-1 rounded-full bg-zinc-100 font-medium whitespace-nowrap">{product.category_name}</span></div>
          <div className="flex items-center justify-between"><p className="font-display font-bold text-[18px] tracking-tight">₦{Number(product.price).toLocaleString()}</p><div className="flex items-center gap-1 text-[11px] text-zinc-500"><Eye className="h-3.5 w-3.5" /> {product.views || 0}</div></div>
          <div className="mt-3 flex items-center justify-between text-[12px] text-zinc-500"><span className="flex items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5" /> {product.location || 'Campus'}</span><span className="truncate max-w-[90px]">{product.seller_name}</span></div>
        </div>
      </div>
    </Link>
  );
}
