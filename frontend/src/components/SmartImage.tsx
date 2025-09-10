import { useState, useRef, useEffect } from 'react'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  fallbackClassName?: string
}

export default function SmartImage({ 
  src, 
  alt, 
  className = '',
  containerClassName = 'w-full h-48',
  fallbackClassName = 'w-full h-48 bg-gray-200 rounded-md flex items-center justify-center'
}: SmartImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null)
  const [useContainMode, setUseContainMode] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight
      setImageAspectRatio(aspectRatio)
      
      // Determine if we should use contain mode based on extreme aspect ratios
      // Use contain for very wide (>2.5:1) or very tall (<0.4:1) images to avoid excessive cropping
      const shouldUseContain = aspectRatio > 2.5 || aspectRatio < 0.4
      setUseContainMode(shouldUseContain)
      
      setImageLoaded(true)
    }
    img.onerror = () => {
      setImageError(true)
    }
    img.src = src
  }, [src])

  if (imageError) {
    return (
      <div className={fallbackClassName}>
        <span className="text-gray-500 text-sm">No image</span>
      </div>
    )
  }

  return (
    <div className={`${containerClassName} relative overflow-hidden bg-gray-100`}>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 w-full h-full rounded-md"></div>
        </div>
      )}
      
      {imageLoaded && (
        <div className="relative w-full h-full group">
          {/* Main Image */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={`
              absolute inset-0 w-full h-full transition-all duration-300
              ${useContainMode 
                ? 'object-contain bg-gradient-to-br from-gray-50 to-gray-100' 
                : 'object-cover'
              }
              ${className}
            `}
            style={{
              filter: useContainMode ? 'none' : 'brightness(1.02) contrast(1.05) saturate(1.1)',
            }}
          />
          
          {/* Premium Overlay Effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Subtle Border Enhancement */}
          <div className="absolute inset-0 ring-1 ring-black/5"></div>
          
          {/* Loading Shimmer Effect (only visible during load) */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          )}
        </div>
      )}
      
      {/* Aspect Ratio Indicator (for debugging - remove in production) */}
      {process.env.NODE_ENV === 'development' && imageAspectRatio && (
        <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {useContainMode ? 'Contain' : 'Cover'} • {imageAspectRatio.toFixed(2)}
        </div>
      )}
    </div>
  )
}

// Add this CSS to your global styles or Tailwind config for the shimmer effect
const shimmerCSS = `
  @keyframes shimmer {
    0% { transform: translateX(-100%) }
    100% { transform: translateX(100%) }
  }
  .animate-shimmer {
    animation: shimmer 1.5s infinite;
  }
`

// Export the CSS for manual inclusion if needed
export { shimmerCSS }
