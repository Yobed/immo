'use client'
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui'

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export function SearchBar({
  placeholder = 'Rechercher un bien (commune, type, quartier...)',
  className = '',
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '0')
    if (query.trim()) {
      params.set('q', query.trim())
    } else {
      params.delete('q')
    }
    startTransition(() => {
      router.push(`/recherche?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSearch} className={`flex gap-2 ${className}`}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-btn border border-[var(--border)] px-4 py-2.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-0"
      />
      <Button type="submit" loading={isPending}>
        Rechercher
      </Button>
    </form>
  )
}
