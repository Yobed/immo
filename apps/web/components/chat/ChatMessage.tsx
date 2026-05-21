'use client'
import { Sparkles, User } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  role:    'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: Props) {
  const isUser = role === 'user'
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-8 group`}>
      <div className={`flex items-center gap-3 mb-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
          isUser 
            ? 'bg-[var(--text)]/5 border-[var(--text)]/10' 
            : 'bg-[var(--accent-luxury)]/20 border-[var(--accent-luxury)]/30'
        }`}>
          {isUser ? <User className="w-3.5 h-3.5 text-[var(--text)]/40" /> : <Sparkles className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text)]/20">
          {isUser ? 'Client Privilégié' : 'Sapphire Intelligence'}
        </span>
      </div>
      
      <div
        className={`max-w-[90%] px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed transition-all duration-500 ${
          isUser
            ? 'bg-[var(--accent-luxury)] border border-[var(--accent-luxury)] text-[var(--midnight)] rounded-tr-sm shadow-xl'
            : 'bg-[var(--off-white)]/5 border border-[var(--off-white)]/10 text-[var(--text)]/90 rounded-tl-sm backdrop-blur-md'
        }`}
      >
        {renderContent(content)}
      </div>
    </div>
  )
}

function renderContent(content: string) {
  const markdownImageRegex = /(!\[.*?\]\s*\(.*?\))/g;
  const rawUrlRegex = /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?[^\s]*)?)/gi;
  
  const parts = content.split(markdownImageRegex);
  
  return parts.map((part, index) => {
    const match = part.match(/!\[(.*?)\]\s*\((.*?)\)/);
    if (match) {
      const alt = match[1];
      const url = match[2];
      return (
        <motion.div 
          key={index} 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="my-4 rounded-xl overflow-hidden border border-white/10 shadow-md group/img relative"
        >
          <img 
            src={url} 
            alt={alt} 
            className="w-full h-auto max-h-[300px] object-cover hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity">
            <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">{alt || 'Aperçu du bien'}</p>
          </div>
        </motion.div>
      );
    }

    if (part.match(/^https?:\/\//)) {
      return (
        <motion.div
          key={`img-${index}`}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="my-6 relative group overflow-hidden rounded-[2rem] border border-white/10 aspect-video bg-white/5"
        >
          <img 
            src={part} 
            alt="Visualisation de prestige"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
            <p className="text-[10px] text-white/80 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-luxury)]" />
              Détail Exclusif
            </p>
          </div>
        </motion.div>
      );
    }
    
    const subParts = part.split(rawUrlRegex);
    return subParts.map((subPart, subIndex) => {
      if (subPart.match(rawUrlRegex)) {
        return (
          <motion.div
            key={`raw-img-${index}-${subIndex}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-4 rounded-3xl overflow-hidden border border-white/5"
          >
            <img src={subPart} alt="Bien" className="w-full object-cover" />
          </motion.div>
        );
      }
      return subPart.split('\n').map((line, i) => (
        <span key={`text-${index}-${subIndex}-${i}`}>
          {renderInlineLinks(line, `${index}-${subIndex}-${i}`)}
          {i < subPart.split('\n').length - 1 && <br />}
        </span>
      ));
    });
  });
}

const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
const PLAIN_URL_REGEX = /(https?:\/\/[^\s)]+)/g

function renderInlineLinks(text: string, keyPrefix: string): React.ReactNode {
  if (!text) return null

  const nodes: React.ReactNode[] = []
  let cursor = 0
  let i = 0

  const md = [...text.matchAll(MARKDOWN_LINK_REGEX)].map(m => ({
    start: m.index!,
    end: m.index! + m[0].length,
    label: m[1],
    url: m[2],
    type: 'md' as const,
  }))

  const consumed: Array<[number, number]> = md.map(m => [m.start, m.end])
  const inMd = (idx: number) => consumed.some(([s, e]) => idx >= s && idx < e)

  const plain = [...text.matchAll(PLAIN_URL_REGEX)]
    .filter(m => !inMd(m.index!))
    .map(m => ({
      start: m.index!,
      end: m.index! + m[0].length,
      label: m[0],
      url: m[0],
      type: 'plain' as const,
    }))

  const all = [...md, ...plain].sort((a, b) => a.start - b.start)

  for (const link of all) {
    if (link.start > cursor) {
      nodes.push(<span key={`t-${keyPrefix}-${i++}`}>{text.slice(cursor, link.start)}</span>)
    }
    nodes.push(
      <a
        key={`a-${keyPrefix}-${i++}`}
        href={link.url}
        target={link.url.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="text-[var(--accent-luxury)] underline decoration-[var(--accent-luxury)]/40 underline-offset-2 hover:decoration-[var(--accent-luxury)] font-semibold break-all"
      >
        {link.label}
      </a>
    )
    cursor = link.end
  }
  if (cursor < text.length) {
    nodes.push(<span key={`t-${keyPrefix}-${i++}`}>{text.slice(cursor)}</span>)
  }

  return nodes.length > 0 ? nodes : text
}
