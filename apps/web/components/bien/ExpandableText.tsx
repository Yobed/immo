'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpandableTextProps {
  text: string
  limit?: number
}

export function ExpandableText({ text, limit = 200 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  
  const isLong = text.length > limit
  const displayText = expanded || !isLong ? text : text.slice(0, limit) + '...'

  return (
    <div className="relative">
      <p className="text-base md:text-lg font-light text-slate-700 leading-[1.7] break-words whitespace-pre-wrap transition-all duration-300">
        {displayText}
      </p>
      
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-amber-600 font-bold text-sm hover:text-amber-700 transition-colors"
        >
          {expanded ? (
            <>
              Voir moins <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Lire la suite <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
