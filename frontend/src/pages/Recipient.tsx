import { useState } from 'react'
import ItemsList from '../components/ItemsList'

export default function Recipient() {
  const [query, setQuery] = useState('')
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recipient</h2>
      <div className="flex gap-2">
        <input
          className="border p-2 w-full"
          placeholder="Search items…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ItemsList query={query} />
    </div>
  )
}


