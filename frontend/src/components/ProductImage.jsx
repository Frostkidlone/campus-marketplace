import { ImageIcon } from 'lucide-react';
import { getImageUrl } from '../api/axios';

/**
 * Renders a listing image, or a consistent placeholder when the seller
 * has not uploaded one. Keeps cards from showing broken image icons.
 */
export default function ProductImage({ src, alt = '', className = '', compact = false }) {
  const url = getImageUrl(src);
  if (!url) {
    return (
      <div className={`grid place-items-center bg-zinc-100 text-zinc-400 ${className}`}>
        {compact ? (
          <ImageIcon className="h-5 w-5" />
        ) : (
          <div className="text-center">
            <ImageIcon className="h-7 w-7 mx-auto" />
            <span className="text-[10px] uppercase tracking-wide mt-1 block">No image</span>
          </div>
        )}
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
