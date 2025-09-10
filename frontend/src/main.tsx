import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import AppRouter from './AppRouter'

const rootEl = document.getElementById('root')!

try {
  createRoot(rootEl).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </StrictMode>,
  )
} catch (err) {
  const message = err instanceof Error ? err.stack || err.message : String(err)
  rootEl.innerHTML = `<pre style="white-space:pre-wrap;color:#b91c1c;background:#fef2f2;padding:12px;border:1px solid #fecaca;border-radius:6px;">${message}</pre>`
}
