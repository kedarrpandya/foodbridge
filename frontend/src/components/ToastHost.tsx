import { useEffect } from 'react'
import { useToast } from '../store/toast'

export default function ToastHost() {
  const { toasts, remove } = useToast()

  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => remove(t.id), 3000))
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [toasts, remove])

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-3 py-2 text-sm rounded shadow border ${
            t.type === 'success'
              ? 'bg-green-600 text-white border-green-700'
              : t.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-gray-800 text-white border-gray-900'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}


