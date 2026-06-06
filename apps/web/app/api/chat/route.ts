import { NextRequest } from 'next/server'
import { chatImmobilierStream } from '@/lib/ai'
import type { ChatMessage }     from '@/lib/ai'
import { getAIBienContext } from '@/lib/ai/tools'

export async function POST(req: NextRequest) {
  try {
    const { messages, context: propertyContext } = await req.json() as { messages: ChatMessage[], context?: string }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages requis' }), { status: 400 })
    }

    // Extraction dynamique de biens en fonction du dernier message de l'utilisateur
    const lastUserMessage = messages[messages.length - 1]?.content || ""
    const dynamicSearchContext = await getAIBienContext(lastUserMessage)
    
    // Fusion du contexte statique (page de bien actuelle) et dynamique (catalogue)
    const combinedContext = [
      propertyContext && `[BIEN ACTUELLEMENT CONSULTÉ] :\n${propertyContext}`,
      dynamicSearchContext && `[EXTRAITS DU CATALOGUE GÉNÉRAL] :\n${dynamicSearchContext}`
    ].filter(Boolean).join('\n\n---\n\n')

    const stream = await chatImmobilierStream(messages, combinedContext)
    
    if (!stream) {
      throw new Error("Impossible de démarrer le flux avec OpenRouter")
    }

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Chat processing failed' }), { status: 500 })
  }
}
