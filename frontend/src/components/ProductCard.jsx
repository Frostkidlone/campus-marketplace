
import { Link } from 'react-router-dom'
export default function ProductCard({product}){
  return (
    <div className="bg-white rounded-xl border hover:shadow-lg overflow-hidden">
      <div className="aspect-[4/3] bg-gray-100">
        {product.image_url || product.image ? <img src={product.image_url || product.image} alt={product.title} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>}
      </div>
      <div className="p-4">
        <div className="flex justify-between"><h3 className="font-semibold line-clamp-1">{product.title}</h3><p className="font-bold text-blue-600">₦{Number(product.price).toLocaleString()}</p></div>
        <p className="text-xs text-gray-500">{product.category_name} • {product.location || 'Campus'}</p>
        <p className="text-sm text-gray-600 line-clamp-2 my-2">{product.description}</p>
        <Link to={`/products/${product.id}`} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg">View Details</Link>
      </div>
    </div>
  )
}
