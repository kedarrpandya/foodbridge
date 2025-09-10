import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { OrganizationOut, ItemOut } from '../lib/api'
import { useToast } from '../store/toast'
import { useAuth } from '../store/auth'
import LocationSelector from '../components/LocationSelector'

const orgSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  type: z.string().min(1, 'Organization type is required'),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
})

const itemSchema = z.object({
  org_id: z.coerce.number().int().positive(),
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  allergens: z.array(z.string()).default([]),
  storage_type: z.string().optional(),
  quantity: z.coerce.number().positive().optional(),
  ready_at: z.string().optional(),
  expires_at: z.string().optional(),
  pickup_window: z.string().optional(),
  status: z.string().default('listed'),
  photo_url: z.string().optional(),
})

export default function Donor() {
  const qc = useQueryClient()
  const { add } = useToast()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  
  // Location state for organization
  const [orgAddress, setOrgAddress] = useState('')
  const [orgLat, setOrgLat] = useState<number | null>(null)
  const [orgLng, setOrgLng] = useState<number | null>(null)

  const orgsQuery = useQuery({
    queryKey: ['orgs'],
    queryFn: async () => {
      const { data } = await api.get<OrganizationOut[]>('/orgs')
      return data
    },
  })

  const createOrg = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post<OrganizationOut>('/orgs/', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orgs'] }),
  })

  const createItem = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post<ItemOut>('/items/', payload)
      return data
    },
  })

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/items/upload-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      add('Please select an image file', 'error')
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadImage.mutateAsync(file)
      const fullUrl = `http://127.0.0.1:8000${result.image_url}`
      setUploadedImageUrl(fullUrl)
      setItemValue('photo_url', fullUrl)
      add('Image uploaded successfully!', 'success')
    } catch (error) {
      add('Failed to upload image', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const {
    register: registerOrg,
    handleSubmit: handleSubmitOrg,
    formState: { errors: errorsOrg, isSubmitting: isSubmittingOrg },
    reset: resetOrg,
    setValue: setOrgValue,
  } = useForm({ resolver: zodResolver(orgSchema) })

  // Update form when location changes
  useEffect(() => {
    setOrgValue('address', orgAddress)
    if (orgLat !== null) setOrgValue('lat', orgLat)
    if (orgLng !== null) setOrgValue('lng', orgLng)
  }, [orgAddress, orgLat, orgLng, setOrgValue])

  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    formState: { errors: errorsItem, isSubmitting: isSubmittingItem },
    reset: resetItem,
    setValue: setItemValue,
    watch: watchItem,
  } = useForm({ resolver: zodResolver(itemSchema) })

  // Watch the photo_url field to sync with uploaded image
  const photoUrl = watchItem('photo_url')

  // Update photo_url when image is uploaded
  useEffect(() => {
    if (uploadedImageUrl && !photoUrl) {
      setItemValue('photo_url', uploadedImageUrl)
    }
  }, [uploadedImageUrl, photoUrl, setItemValue])

  // Authentication prompt for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-primary-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Share Your Extra Food</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Join our community to donate food and help reduce waste in your neighborhood. Every donation makes a difference.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Account to Donate
            </button>
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="w-full border-2 border-gray-200 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Already have an organization? Sign in to start posting food items.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-primary-50">
      {/* Page Header - Integrated with main navigation */}
      <div className="bg-gradient-to-r from-green-600/10 to-blue-600/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Food Donation Portal
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Share your extra food with the community</p>
            <div className="mt-4 text-sm text-gray-500">
              Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
      {/* Enhanced Organization Form */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Organization</h2>
            <p className="text-gray-600">Set up your organization to start donating food</p>
          </div>
        </div>
        <form
          className="space-y-6"
          onSubmit={handleSubmitOrg(async (values) => {
            try {
              await createOrg.mutateAsync(values)
              resetOrg()
              setOrgAddress('')
              setOrgLat(null)
              setOrgLng(null)
              add('Organization created successfully!', 'success')
            } catch (e: any) {
              console.error('Org creation error:', e)
              let errorMsg = 'Failed to create organization'
              if (e?.response?.data?.detail) {
                if (Array.isArray(e.response.data.detail)) {
                  errorMsg = e.response.data.detail.map((err: any) => err.msg).join(', ')
                } else {
                  errorMsg = e.response.data.detail
                }
              } else if (e?.message) {
                errorMsg = e.message
              }
              add(errorMsg, 'error')
            }
          })}
        >
          <div>
            <label className="block text-sm font-medium">Organization Name *</label>
            <input 
              className="input" 
              placeholder="e.g., Green Valley Restaurant, Food Bank Central"
              {...registerOrg('name')} 
            />
            {errorsOrg.name && <p className="text-red-600 text-sm">{errorsOrg.name.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium">Organization Type *</label>
            <select className="input" {...registerOrg('type')}>
              <option value="">Select type...</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Grocery Store">Grocery Store</option>
              <option value="Bakery">Bakery</option>
              <option value="Cafe">Cafe</option>
              <option value="Catering">Catering Company</option>
              <option value="Food Bank">Food Bank</option>
              <option value="Charity">Charity Organization</option>
              <option value="Community Center">Community Center</option>
              <option value="School">School</option>
              <option value="Hospital">Hospital</option>
              <option value="Other">Other</option>
            </select>
            {errorsOrg.type && <p className="text-red-600 text-sm">{errorsOrg.type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input 
                type="tel"
                className="input" 
                placeholder="(555) 123-4567"
                {...registerOrg('phone')} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input 
                type="email"
                className="input" 
                placeholder="contact@organization.com"
                {...registerOrg('email')} 
              />
              {errorsOrg.email && <p className="text-red-600 text-sm">{errorsOrg.email.message}</p>}
            </div>
          </div>

          <LocationSelector
            lat={orgLat}
            lng={orgLng}
            onAddressChange={setOrgAddress}
            onLocationChange={(lat, lng) => {
              setOrgLat(lat)
              setOrgLng(lng)
            }}
          />

          <button className="btn btn-primary" disabled={isSubmittingOrg}>
            {isSubmittingOrg ? 'Creating…' : 'Create Organization'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Create Item</h2>
        <form
          className="space-y-3"
          onSubmit={handleSubmitItem(async (values) => {
            try {
              console.log('Submitting item:', values)
              await createItem.mutateAsync(values)
              resetItem()
              setUploadedImageUrl('')
              add('Item created successfully!', 'success')
            } catch (e: any) {
              console.error('Item creation error:', e)
              let errorMsg = 'Failed to create item'
              if (e?.response?.data?.detail) {
                if (Array.isArray(e.response.data.detail)) {
                  errorMsg = e.response.data.detail.map((err: any) => err.msg).join(', ')
                } else {
                  errorMsg = e.response.data.detail
                }
              } else if (e?.message) {
                errorMsg = e.message
              }
              add(errorMsg, 'error')
            }
          })}
        >
          <div>
            <label className="block text-sm">Organization</label>
            <select className="input" {...registerItem('org_id')}>
              <option value="">Select…</option>
              {orgsQuery.data?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            {errorsItem.org_id && <p className="text-red-600 text-sm">Organization is required</p>}
          </div>
          <div>
            <label className="block text-sm">Title</label>
            <input className="input" {...registerItem('title')} />
            {errorsItem.title && <p className="text-red-600 text-sm">{errorsItem.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm">Description</label>
            <textarea className="input" {...registerItem('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Category</label>
              <input className="input" {...registerItem('category')} />
            </div>
            <div>
              <label className="block text-sm">Quantity</label>
              <input className="input" {...registerItem('quantity')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Ready At</label>
              <input 
                type="datetime-local" 
                className="input" 
                {...registerItem('ready_at')} 
              />
            </div>
            <div>
              <label className="block text-sm">Expires At</label>
              <input 
                type="datetime-local" 
                className="input" 
                {...registerItem('expires_at')} 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm">Pickup Window</label>
            <input className="input" {...registerItem('pickup_window')} />
          </div>
          
          {/* Photo Upload Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">Photo</label>
            
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isUploading}
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                {isUploading ? (
                  <div className="text-gray-600">
                    <div className="text-2xl mb-1">⏳</div>
                    <div className="text-sm">Uploading...</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl mb-1">📷</div>
                    <div className="text-sm text-gray-600">Click to upload image</div>
                    <div className="text-xs text-gray-500 mt-1">JPG, PNG, GIF (max 10MB)</div>
                  </div>
                )}
              </label>
            </div>

            {/* Image Preview */}
            {uploadedImageUrl && (
              <div className="text-center bg-green-50 p-3 rounded-lg border border-green-200">
                <img 
                  src={uploadedImageUrl} 
                  alt="Uploaded preview" 
                  className="w-24 h-24 object-cover rounded-lg mx-auto border border-green-300"
                />
                <p className="text-green-700 text-sm mt-2">✅ Image uploaded</p>
              </div>
            )}

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Photo URL</label>
              <input 
                className="border p-2 w-full" 
                placeholder="https://example.com/image.jpg" 
                {...registerItem('photo_url')} 
              />
              <div className="text-xs text-gray-500 mt-1">
                Try: <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Unsplash</a>, 
                <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">Imgur</a>, or 
                <a href="https://picsum.photos/400/300" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">Lorem Picsum</a>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" disabled={isSubmittingItem}>
            {isSubmittingItem ? 'Saving…' : 'Create Item'}
          </button>
        </form>
      </div>
        </div>
      </div>
    </div>
  )
}