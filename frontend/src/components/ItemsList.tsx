import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ItemOut } from '../lib/api'
import SmartImage from './SmartImage'
import ClaimModal from './ClaimModal'
import { useState } from 'react'

export default function ItemsList({ query = '', category }: { query?: string; category?: string | null }) {
  const [selectedItem, setSelectedItem] = useState<ItemOut | null>(null)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', query],
    queryFn: async () => {
      const { data } = await api.get<ItemOut[]>('/items', { params: { q: query, status: 'listed', limit: 50 } })
      return data
    },
    staleTime: 15_000,
  })

  const handleClaimClick = (item: ItemOut) => {
    setSelectedItem(item)
    setIsClaimModalOpen(true)
  }

  const handleClaimSuccess = () => {
    // The query will be invalidated by the modal, so items will refresh
  }

  if (isLoading) return <p className="text-gray-500">Loading items…</p>
  if (error) return <p className="text-red-600">Failed to load items</p>
  const dataFiltered = category ? (data || []).filter((it) => (it.category || '').toLowerCase() === category.toLowerCase()) : data
  if (!dataFiltered || dataFiltered.length === 0) return <p className="text-gray-500">No items found.</p>

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {dataFiltered.map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-card hover:shadow-cardHover transition-all duration-300 group">
          {/* Premium Image Section with Minimal Padding */}
          <div className="relative p-3">
            {item.photo_url ? (
              <SmartImage
                src={item.photo_url}
                alt={item.title}
                containerClassName="w-full h-40 rounded-lg overflow-hidden"
                className="group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">No image available</span>
              </div>
            )}
            
            {/* Category Badge Overlay */}
            {item.category && (
              <div className="absolute top-6 left-6">
                <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-2.5 py-1 rounded-md text-xs font-medium shadow-sm">
                  {item.category}
                </span>
              </div>
            )}
            
            {/* Status Badge Overlay */}
            <div className="absolute top-6 right-6">
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium shadow-sm backdrop-blur-sm ${
                item.status === 'listed' ? 'bg-green-500/90 text-white' :
                item.status === 'claimed' ? 'bg-yellow-500/90 text-white' :
                'bg-gray-500/90 text-white'
              }`}>
                {item.status}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-4 pb-3 pt-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">{item.title}</h3>
            {item.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
            
            {/* Compact Item Details Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {item.storage_type && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-xs text-gray-600 truncate">{item.storage_type}</span>
                </div>
              )}
              
              {item.quantity != null && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-gray-600"><span className="font-bold">Quantity:</span> {item.quantity}</span>
                </div>
              )}
              
              {item.pickup_window && (
                <div className="flex items-center space-x-2 col-span-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                  <span className="text-xs text-gray-600 truncate"><span className="font-bold">Time:</span> {item.pickup_window}</span>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="space-y-1 mb-3">
              {item.ready_at && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Ready:</span>
                  <span className="text-gray-700 font-medium">
                    {new Date(item.ready_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {item.expires_at && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Expires:</span>
                  <span className="text-red-600 font-medium">
                    {new Date(item.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Claim Button Section */}
            {item.status === 'listed' ? (
              <button
                onClick={() => handleClaimClick(item)}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors font-medium"
              >
                Claim This Item
              </button>
            ) : item.status === 'claimed' ? (
              <div className="w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded-md text-center font-medium">
                Already Claimed
              </div>
            ) : (
              <div className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-md text-center font-medium">
                Not Available
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Claim Modal */}
      <ClaimModal
        item={selectedItem}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSuccess={handleClaimSuccess}
      />
    </div>
  )
}


