import React from 'react'
import { API_URL } from '../config/api';

const OrderCard = ({ item, order }) => {
  // Helper to resolve image URL from multiple possible shapes
  const resolveImage = () => {
    const img = item?.imageUrl || (Array.isArray(item?.images) && item.images[0]) || (Array.isArray(item?.food?.images) && item.food.images[0]) || item?.image || item?.photo;
    if (!img) return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%23333'/><text x='50%' y='50%' fill='%23fff' font-size='9' font-family='Arial' text-anchor='middle' dominant-baseline='central'>No+Image</text></svg>";
    if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:'))) return img;
    if (typeof img === 'string' && img.startsWith('/')) return `${API_URL}${img}`;
    if (typeof img === 'string') return `${API_URL}/${img}`;
    return '';
  };

  const displayName = item?.name || item?.title || item?.food?.name || 'Unknown Item';
  const displayPrice = Number(item?.unitPrice ?? item?.price ?? item?.totalPrice ?? item?.food?.price ?? 0) || 0;
  const displayQuantity = Number(item?.quantity ?? item?.qty ?? item?.count ?? 1) || 1;
  const lineTotal = Number((item?.totalPrice ?? (displayPrice * displayQuantity)) || 0);

  return (
    <div className='flex justify-between items-center p-4'>
      <div className='flex items-center space-x-4'>
        <img className="h-14 w-14 rounded object-cover bg-gray-100" src={resolveImage()} alt={displayName} />
        <div className='text-sm'>
          <p className='font-medium'>{displayName}</p>
          <p className='text-xs text-gray-500'>Qty: {displayQuantity} • Unit: ₹{displayPrice} • Line: ₹{lineTotal}</p>
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        <span className="text-white text-xs uppercase tracking-wide">{order?.status || order?.orderStatus}</span>
      </div>
    </div>
  )
}

export default OrderCard