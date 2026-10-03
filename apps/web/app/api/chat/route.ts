import { NextRequest } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { chatImmobilierStream } from '@/lib/ai'
import type { ChatMessage }     from '@/lib/ai'
import { getAIBienContext } from '@/lib/ai/tools'
import { recall, retain, reflect } from '@/lib/memory/hindsight'

export async function POST(req: NextRequest) {
  try {
    const { messages, context: propertyContext, userId, phone } = (await req.json()) as {
      messages: ChatMessage[]
      context?: string
      userId?: string
      phone?: string
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages requis' }), { status: 400 })
    }

    // Extraction dynamique de biens en fonction du dernier message de l'utilisateur
    const lastUserMessage = messages[messages.length - 1]?.content || ''
    const dynamicSearchContext = await getAIBienContext(lastUserMessage)

    // Identifiant d'entité pour la mémoire biomimétique Hindsight (téléphone, userId ou cookie de session)
    let sessionId = req.cookies.get('bogbes_chat_session')?.value
    let isNewSessionCookie = false
    if (!sessionId && !phone && !userId) {
      sessionId = `anon_${crypto.randomUUID()}`
      isNewSessionCookie = true
    }
    const entityId = phone || userId || req.headers.get('x-user-id') || sessionId || ''
    let memoryContext = ''
    if (entityId) {
      try {
        const memory = await recall(entityId)
        if (memory.promptContext) {
          memoryContext = memory.promptContext
        }
      } catch (err) {
        console.warn('[Hindsight][web] recall failed:', err)
      }
    }

    // Fusion de la mémoire Hindsight, du bien actuellement consulté et des extraits catalogue
    const combinedContext = [
      memoryContext,
      propertyContext && `[BIEN ACTUELLEMENT CONSULTÉ] :\n${propertyContext}`,
      dynamicSearchContext && `[EXTRAITS DU CATALOGUE GÉNÉRAL] :\n${dynamicSearchContext}`,
    ]
      .filter(Boolean)
      .join('\n\n---\n\n')

    // Enregistrement asynchrone de l'expérience et mise à jour cognitive Hindsight
    if (entityId && lastUserMessage) {
      waitUntil(
        retain({
          entityId,
          channel: 'web',
          type: 'message',
          content: lastUserMessage,
        })
          .then(() => {
            if (messages.length >= 2) {
              return reflect(entityId)
            }
          })
          .catch((err) => console.warn('[Hindsight][web] retain/reflect failed:', err))
      )
    }

    const stream = await chatImmobilierStream(messages, combinedContext)

    const responseHeaders = new Headers({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    if (isNewSessionCookie && sessionId) {
      responseHeaders.append(
        'Set-Cookie',
        `bogbes_chat_session=${sessionId}; Path=/; Max-Age=31536000; SameSite=Lax`
      )
    }

    return new Response(stream, { headers: responseHeaders })
  } catch (error: unknown) {
    const err = error as Error
    console.error('[Chat API] failed:', err.message)
    return new Response(JSON.stringify({ error: 'Chat processing failed' }), { status: 500 })
  }
}
