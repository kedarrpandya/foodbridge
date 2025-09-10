import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../lib/api'
import type { ItemOut } from '../lib/api'
import { useAuth } from '../store/auth'

interface ClaimModalProps {
  item: ItemOut | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const claimSchema = z.object({
  claimer_name: z.string().min(2, 'Name must be at least 2 characters'),
  claimer_phone: z.string().optional(),
  claimer_email: z.string().email('Invalid email format').optional().or(z.literal('')),
})

type ClaimFormData = z.infer<typeof claimSchema>

export default function ClaimModal({ item, isOpen, onClose, onSuccess }: ClaimModalProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<'form' | 'success' | 'contact'>('form')
  const [claimedDetails, setClaimedDetails] = useState<ItemOut | null>(null)
  const { user, isAuthenticated } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
  })

  // Prefill email from logged-in user if available
  useEffect(() => {
    if (isOpen && isAuthenticated && user?.email) {
      // react-hook-form's reset to set default values
      reset({ claimer_name: '', claimer_email: user.email, claimer_phone: '' })
    }
  }, [isOpen, isAuthenticated, user, reset])

  const claimMutation = useMutation({
    mutationFn: async (data: ClaimFormData) => {
      const { data: result } = await api.post(`/items/${item?.id}/claim`, data)
      return result
    },
    onSuccess: (claimedItem) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setStep('success')
      setTimeout(async () => {
        try {
          const { data } = await api.get<ItemOut>(`/items/${claimedItem.id}`)
          // Store detailed item (with organization pickup info) locally
          setClaimedDetails(data)
        } catch {}
        setStep('contact')
      }, 1200)
    },
    onError: (error: any) => {
      alert(error?.response?.data?.detail || 'Failed to claim item')
    },
  })

  const handleClaim = (data: ClaimFormData) => {
    claimMutation.mutate(data)
  }

  const handleClose = () => {
    reset()
    setStep('form')
    setClaimedDetails(null)
    onClose()
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="claim-modal-title">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {step === 'form' && (
          <>
            <div className="p-6 border-b">
              <h2 id="claim-modal-title" className="text-xl font-semibold">Claim Food Item</h2>
              <p className="text-gray-600 mt-1">Claiming: {item.title}</p>
            </div>

            <form onSubmit={handleSubmit(handleClaim)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your Name *</label>
                <input
                  type="text"
                  {...register('claimer_name')}
                  className="input"
                  placeholder="Enter your full name"
                />
                {errors.claimer_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.claimer_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  {...register('claimer_phone')}
                  className="input"
                  placeholder="(555) 123-4567"
                />
                <p className="text-xs text-gray-500 mt-1">For pickup coordination</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  {...register('claimer_email')}
                  className="input"
                  placeholder="your@email.com"
                />
                {errors.claimer_email && (
                  <p className="text-red-600 text-sm mt-1">{errors.claimer_email.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Optional, for updates</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Important Notes:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Please pick up within the specified time window</li>
                  <li>• Contact information will be shared with the donor</li>
                  <li>• You'll receive pickup details after claiming</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {claimMutation.isPending ? 'Claiming...' : 'Claim Item'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-7 w-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 className="text-2xl font-semibold text-green-700 mb-2">Successfully Claimed</h2>
            <p className="text-gray-600">Getting pickup details...</p>
          </div>
        )}

        {step === 'contact' && (
          <>
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-green-600">Item Claimed Successfully!</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Pickup Information:</h3>
                <div className="space-y-2 text-sm">
                  {(() => { const d = claimedDetails || item; return (
                    <>
                      <div><span className="font-medium">Item:</span> {d.title}</div>
                      {d.pickup_window && (
                        <div><span className="font-medium">Time:</span> {d.pickup_window}</div>
                      )}
                      {d.quantity && (
                        <div><span className="font-medium">Quantity:</span> {d.quantity}</div>
                      )}
                      {d.organization?.address && (
                        <div className="pt-1"><span className="font-medium">Pickup Address:</span> {d.organization.address}</div>
                      )}
                      {d.organization?.phone && (
                        <div><span className="font-medium">Contact:</span> {d.organization.phone}</div>
                      )}
                    </>
                  )})()}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>The donor has been notified of your claim</li>
                  <li>You may receive contact from the donor for pickup coordination</li>
                  <li>Please be punctual for pickup</li>
                  <li>Bring a bag or container if needed</li>
                </ol>
              </div>

              <button
                onClick={handleClose}
                className="w-full btn btn-primary"
              >
                Got it!
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
