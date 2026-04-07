import { NextRequest } from 'next/server'
import { chatImmobilierStream } from '@/lib/claude'
import type { ChatMessage }     from '@/lib/claude'

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as { messages: ChatMessage[] }

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages requis' }), { status: 400 })
  }

  const stream = await chatImmobilierStream(messages)

  // Convertir Anthropic stream -> Web ReadableStream pour Next.js Response
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
